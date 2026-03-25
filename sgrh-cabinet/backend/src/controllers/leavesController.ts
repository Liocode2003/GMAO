import { Request, Response } from 'express';
import { query, getClient } from '../config/database';
import { logger } from '../utils/logger';
import {
  sendUnplannedLeaveAlert,
  sendLeaveBalanceAlert,
} from '../services/emailService';

// ============================================================
// UTILITAIRES
// ============================================================

/** Retourne true si l'année est bissextile (366 jours), false sinon (365 jours). */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/** Retourne le nombre de jours dans l'année : 366 si bissextile, 365 sinon. */
export function daysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
}

/** Nombre maximum de jours de congé reportables d'une année à l'autre (1 an complet). */
function maxCarryOver(year: number): number {
  return daysInYear(year);
}

/** Nombre de jours calendaires entre deux dates (inclus) — weekends et jours fériés compris. */
function calendarDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const diffMs = e.getTime() - s.getTime();
  return Math.round(diffMs / (24 * 3600 * 1000)) + 1; // +1 pour inclure le jour de début
}

/**
 * Calcul pro-rata du droit annuel de congés (base légale : 30 jours ouvrables/an).
 *
 * - Employé présent depuis le 1er janvier → 30 jours
 * - Employé arrivé en cours d'année       → (mois restants / 12) × 30, arrondi au 0.5 supérieur
 * - Employé pas encore en poste           → 0
 *
 * Le calcul tient compte du nombre réel de jours dans l'année (365 ou 366)
 * pour une précision maximale lors d'une arrivée en cours d'année.
 */
function proRataAllowance(entryDate: string, year: number): number {
  const entry = new Date(entryDate);
  const total = daysInYear(year); // 365 ou 366 selon que l'année est bissextile

  if (entry.getFullYear() < year) return 30; // présent depuis le 1er janvier → droit complet
  if (entry.getFullYear() > year) return 0;  // pas encore en poste cette année

  // Jours restants du jour d'entrée au 31 décembre (inclus)
  const yearEnd = new Date(year, 11, 31);
  const diffMs = yearEnd.getTime() - entry.getTime();
  const daysRemaining = Math.ceil(diffMs / (24 * 3600 * 1000)) + 1;

  // Pro-rata précis basé sur les jours réels de l'année (365 ou 366)
  const raw = (daysRemaining / total) * 30;
  return Math.ceil(raw * 2) / 2; // arrondi au demi-jour supérieur
}

async function getHREmails(): Promise<string[]> {
  const result = await query(
    `SELECT email FROM users WHERE role IN ('DRH', 'DIRECTION_GENERALE') AND is_active = true`
  );
  return result.rows.map((r: { email: string }) => r.email).filter(Boolean);
}

async function ensureBalance(employeeId: string, year: number): Promise<void> {
  const empRes = await query(
    `SELECT entry_date FROM employees WHERE id = $1`,
    [employeeId]
  );
  const entryDate: string | undefined = empRes.rows[0]?.entry_date;
  const allowance = entryDate ? proRataAllowance(entryDate, year) : 30;

  await query(
    `INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken, days_unpaid)
     VALUES ($1, $2, $3, 0, 0, 0)
     ON CONFLICT (employee_id, year) DO NOTHING`,
    [employeeId, year, allowance]
  );
}

async function recalcBalance(employeeId: string, year: number): Promise<void> {
  const taken = await query(
    `SELECT COALESCE(SUM(days), 0) as total
     FROM leaves
     WHERE employee_id = $1 AND year = $2 AND type = 'PLANIFIE' AND status = 'APPROUVE'`,
    [employeeId, year]
  );
  await query(
    `UPDATE leave_balances SET days_taken = $1, updated_at = NOW()
     WHERE employee_id = $2 AND year = $3`,
    [taken.rows[0].total, employeeId, year]
  );
}

// ============================================================
// SOLDE CONGÉS D'UN COLLABORATEUR
// ============================================================

export const getLeaveBalance = async (req: Request, res: Response) => {
  const { id } = req.params;
  const year = parseInt(req.query.year as string) || new Date().getFullYear();

  try {
    await ensureBalance(id, year);

    const balRes = await query(
      `SELECT lb.*,
         e.first_name, e.last_name, e.entry_date,
         (SELECT COALESCE(SUM(days),0) FROM leaves
          WHERE employee_id = $1 AND year = $2 AND type = 'IMPRÉVU') as days_unplanned,
         (SELECT COALESCE(SUM(days),0) FROM leaves
          WHERE employee_id = $1 AND year = $2 AND status = 'EN_ATTENTE') as days_pending
       FROM leave_balances lb
       JOIN employees e ON e.id = lb.employee_id
       WHERE lb.employee_id = $1 AND lb.year = $2`,
      [id, year]
    );

    const bal = balRes.rows[0] || null;
    if (bal) {
      // Correction automatique des données corrompues :
      // annual_allowance doit être entre 0 et 30 jours (droit légal max = 30 j/an)
      const MAX_LEGAL_ALLOWANCE = 30;
      if (Number(bal.annual_allowance) > MAX_LEGAL_ALLOWANCE) {
        const corrected = bal.entry_date
          ? proRataAllowance(bal.entry_date, year)
          : MAX_LEGAL_ALLOWANCE;
        bal.annual_allowance = corrected;
        await query(
          `UPDATE leave_balances SET annual_allowance = $1, updated_at = NOW()
           WHERE employee_id = $2 AND year = $3`,
          [corrected, id, year]
        );
        logger.info(`Correction annual_allowance: valeur corrompue → ${corrected} (employé ${id}, année ${year})`);
      }
    }
    return res.json(bal);
  } catch (err) {
    logger.error('getLeaveBalance error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// LISTE DES CONGÉS D'UN COLLABORATEUR
// ============================================================

export const listLeaves = async (req: Request, res: Response) => {
  const { id } = req.params;
  const year = req.query.year ? parseInt(req.query.year as string) : null;

  try {
    const params: unknown[] = [id];
    let yearClause = '';
    if (year) {
      params.push(year);
      yearClause = `AND l.year = $${params.length}`;
    }

    const result = await query(
      `SELECT l.*,
         u.first_name || ' ' || u.last_name as created_by_name,
         a.first_name || ' ' || a.last_name as approved_by_name
       FROM leaves l
       LEFT JOIN users u ON u.id = l.created_by
       LEFT JOIN users a ON a.id = l.approved_by
       WHERE l.employee_id = $1 ${yearClause}
       ORDER BY l.start_date DESC`,
      params
    );

    return res.json(result.rows);
  } catch (err) {
    logger.error('listLeaves error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// CRÉER UNE DEMANDE DE CONGÉ
// ============================================================

export const createLeave = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    type, absence_subtype, start_date, end_date, notes,
  } = req.body as {
    type: string; absence_subtype?: string;
    start_date: string; end_date: string; notes?: string;
  };

  if (!type || !start_date || !end_date) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  // Vérification : collaborateur actif uniquement
  const empRes = await query(
    `SELECT first_name, last_name, email,
       CASE WHEN exit_date IS NULL OR exit_date > CURRENT_DATE THEN 'ACTIF' ELSE 'INACTIF' END as status
     FROM employees WHERE id = $1`,
    [id]
  );
  const emp = empRes.rows[0];
  if (!emp) return res.status(404).json({ error: 'Collaborateur non trouvé' });
  if (emp.status !== 'ACTIF') {
    return res.status(400).json({ error: 'Impossible de saisir un congé pour un collaborateur inactif' });
  }

  const days = calendarDays(start_date, end_date);
  if (days <= 0) return res.status(400).json({ error: 'Nombre de jours invalide' });

  const year = new Date(start_date).getFullYear();

  const client = await getClient();
  try {
    await client.query('BEGIN');

    await ensureBalance(id, year);

    // Vérification et déduction du solde dans la même transaction (évite TOCTOU)
    if (type === 'PLANIFIE') {
      const balRes = await client.query(
        `SELECT balance FROM leave_balances WHERE employee_id = $1 AND year = $2 FOR UPDATE`,
        [id, year]
      );
      const balance = parseFloat(balRes.rows[0]?.balance ?? '0');
      if (balance < days) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Solde insuffisant. Disponible: ${balance} jour(s), demandé: ${days} jour(s)`,
        });
      }
    }

    const result = await client.query(
      `INSERT INTO leaves
         (employee_id, type, absence_subtype, start_date, end_date, days, year, status, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        id, type, absence_subtype || null,
        start_date, end_date, days, year,
        type === 'IMPRÉVU' ? 'APPROUVE' : 'EN_ATTENTE',
        notes || null, req.user?.userId,
      ]
    );

    const leave = result.rows[0];
    const empName = `${emp.first_name} ${emp.last_name}`;

    // Imprévus : déduire immédiatement du solde dans la même transaction
    if (type === 'IMPRÉVU') {
      const balRes = await client.query(
        `SELECT balance FROM leave_balances WHERE employee_id = $1 AND year = $2 FOR UPDATE`,
        [id, year]
      );
      const balance = parseFloat(balRes.rows[0]?.balance ?? '0');

      if (balance >= days) {
        await client.query(
          `UPDATE leave_balances SET days_taken = days_taken + $1, updated_at = NOW()
           WHERE employee_id = $2 AND year = $3`,
          [days, id, year]
        );
      } else {
        const overflow = days - Math.max(balance, 0);
        await client.query(
          `UPDATE leave_balances
           SET days_taken = days_taken + $1, days_unpaid = days_unpaid + $2, updated_at = NOW()
           WHERE employee_id = $3 AND year = $4`,
          [days, overflow, id, year]
        );

        // Alerte DRH : dépassement de solde (après commit)
        logger.warn(`ALERTE: ${empName} a dépassé son solde de congés (${overflow} jour(s) en dépassement)`);
        getHREmails().then(hrEmails => {
          if (hrEmails.length) {
            sendLeaveBalanceAlert(empName, overflow, hrEmails).catch(
              e => logger.error('sendLeaveBalanceAlert error', e)
            );
          }
        }).catch(e => logger.error('getHREmails error', e));
      }

      // Notification email DRH pour chaque imprévu
      getHREmails().then(hrEmails => {
        if (hrEmails.length) {
          sendUnplannedLeaveAlert(empName, absence_subtype || '', days, hrEmails).catch(
            e => logger.error('sendUnplannedLeaveAlert error', e)
          );
        }
      }).catch(e => logger.error('getHREmails error', e));
    }

    await client.query('COMMIT');
    logger.info(`Congé créé: ${leave.id} pour employé ${id} par ${req.user?.email}`);
    return res.status(201).json(leave);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('createLeave error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  } finally {
    client.release();
  }
};

// ============================================================
// APPROUVER / REFUSER UN CONGÉ
// ============================================================

export const approveLeave = async (req: Request, res: Response) => {
  const { leaveId } = req.params;
  const { status, notes } = req.body as { status: 'APPROUVE' | 'REFUSE'; notes?: string };

  if (!['APPROUVE', 'REFUSE'].includes(status)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }

  try {
    const leaveRes = await query(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);
    const leave = leaveRes.rows[0];
    if (!leave) return res.status(404).json({ error: 'Congé non trouvé' });
    if (leave.status !== 'EN_ATTENTE') {
      return res.status(400).json({ error: 'Ce congé a déjà été traité' });
    }

    await query(
      `UPDATE leaves SET status = $1, approved_by = $2, approved_at = NOW(),
         notes = COALESCE($3, notes), updated_at = NOW()
       WHERE id = $4`,
      [status, req.user?.userId, notes || null, leaveId]
    );

    if (status === 'APPROUVE') {
      await recalcBalance(leave.employee_id, leave.year);
    }

    logger.info(`Congé ${leaveId} ${status} par ${req.user?.email}`);
    return res.json({ message: `Congé ${status === 'APPROUVE' ? 'approuvé' : 'refusé'}` });
  } catch (err) {
    logger.error('approveLeave error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// SUPPRIMER UN CONGÉ (DRH/Direction uniquement)
// ============================================================

export const deleteLeave = async (req: Request, res: Response) => {
  const { leaveId } = req.params;

  try {
    const leaveRes = await query(`SELECT * FROM leaves WHERE id = $1`, [leaveId]);
    const leave = leaveRes.rows[0];
    if (!leave) return res.status(404).json({ error: 'Congé non trouvé' });

    await query(`DELETE FROM leaves WHERE id = $1`, [leaveId]);

    if (leave.status === 'APPROUVE' && leave.type === 'PLANIFIE') {
      await recalcBalance(leave.employee_id, leave.year);
    } else if (leave.type === 'IMPRÉVU' && leave.status === 'APPROUVE') {
      await query(
        `UPDATE leave_balances
         SET days_taken = GREATEST(days_taken - $1, 0), updated_at = NOW()
         WHERE employee_id = $2 AND year = $3`,
        [leave.days, leave.employee_id, leave.year]
      );
    }

    return res.json({ message: 'Congé supprimé' });
  } catch (err) {
    logger.error('deleteLeave error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// REPORT FIN D'ANNÉE (déclenché par le scheduler)
// ============================================================

export const yearEndRollover = async (): Promise<void> => {
  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;

  try {
    // Reporter les soldes des employés ACTIFS uniquement
    const balances = await query(
      `SELECT lb.*, e.entry_date
       FROM leave_balances lb
       JOIN employees e ON e.id = lb.employee_id
       WHERE lb.year = $1 AND (e.exit_date IS NULL OR e.exit_date > CURRENT_DATE)`,
      [currentYear]
    );

    for (const bal of balances.rows) {
      // balance = annual_allowance + carry_over - days_taken (generated column)
      const remaining = parseFloat(bal.balance);
      const unpaid = parseFloat(bal.days_unpaid);
      // Jours non utilisés → ajoutés ; dépassement imprévus → soustraits
      // Le report est plafonné au nombre de jours de l'année suivante (365 ou 366)
      const rawCarryOver = remaining - unpaid;
      const carryOver = Math.min(rawCarryOver, maxCarryOver(nextYear));

      const nextAllowance = proRataAllowance(bal.entry_date, nextYear);

      await query(
        `INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken, days_unpaid)
         VALUES ($1, $2, $3, $4, 0, 0)
         ON CONFLICT (employee_id, year)
         DO UPDATE SET carry_over = $4, annual_allowance = $3, updated_at = NOW()`,
        [bal.employee_id, nextYear, nextAllowance, carryOver]
      );
    }

    // Initialiser les balances pour les nouveaux employés actifs sans solde
    // annual_allowance = 30 jours (droit légal annuel)
    await query(
      `INSERT INTO leave_balances (employee_id, year, annual_allowance, carry_over, days_taken, days_unpaid)
       SELECT e.id, $1, 30, 0, 0, 0
       FROM employees e
       WHERE (e.exit_date IS NULL OR e.exit_date > CURRENT_DATE)
         AND NOT EXISTS (
           SELECT 1 FROM leave_balances lb
           WHERE lb.employee_id = e.id AND lb.year = $1
         )`,
      [nextYear]
    );

    logger.info(`Report fin d'année ${currentYear} → ${nextYear} effectué (${balances.rows.length} employés)`);
  } catch (err) {
    logger.error('yearEndRollover error', err);
  }
};

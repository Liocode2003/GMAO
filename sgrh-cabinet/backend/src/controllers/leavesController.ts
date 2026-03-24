import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import {
  sendUnplannedLeaveAlert,
  sendLeaveBalanceAlert,
} from '../services/emailService';

// ============================================================
// UTILITAIRES
// ============================================================

function workingDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  let count = 0;
  const cur = new Date(s);
  while (cur <= e) {
    const day = cur.getDay();
    if (day !== 0 && day !== 6) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

/** Calcul pro-rata : si l'employé a rejoint en cours d'année,
 *  il bénéficie de (mois restants dans l'année / 12) × 30 jours.
 *  Résultat arrondi au demi-jour supérieur.
 */
function proRataAllowance(entryDate: string, year: number): number {
  const entry = new Date(entryDate);
  if (entry.getFullYear() < year) return 30; // déjà présent en début d'année
  if (entry.getFullYear() > year) return 0;  // pas encore en poste cette année

  // Mois restants (le mois d'entrée compte entier)
  const monthsRemaining = 12 - entry.getMonth(); // getMonth() : 0=janvier → janv=12, déc=1
  const raw = (monthsRemaining / 12) * 30;
  return Math.ceil(raw * 2) / 2; // arrondi au 0.5 supérieur
}

async function getHREmails(): Promise<string[]> {
  const result = await query(
    `SELECT email FROM users WHERE role IN ('DRH', 'DIRECTION_GENERALE') AND is_active = true`
  );
  return result.rows.map((r: { email: string }) => r.email).filter(Boolean);
}

async function ensureBalance(employeeId: string, year: number): Promise<void> {
  // Récupère la date d'entrée pour le calcul pro-rata
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
          WHERE employee_id = $1 AND year = $2 AND type = 'IMPRÉVU') as days_unplanned
       FROM leave_balances lb
       JOIN employees e ON e.id = lb.employee_id
       WHERE lb.employee_id = $1 AND lb.year = $2`,
      [id, year]
    );

    return res.json(balRes.rows[0] || null);
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

  const days = workingDays(start_date, end_date);
  if (days <= 0) return res.status(400).json({ error: 'Nombre de jours invalide' });

  const year = new Date(start_date).getFullYear();

  try {
    await ensureBalance(id, year);

    // Vérification solde pour congés planifiés
    if (type === 'PLANIFIE') {
      const balRes = await query(
        `SELECT balance FROM leave_balances WHERE employee_id = $1 AND year = $2`,
        [id, year]
      );
      const balance = parseFloat(balRes.rows[0]?.balance ?? '0');
      if (balance < days) {
        return res.status(400).json({
          error: `Solde insuffisant. Disponible: ${balance} jour(s), demandé: ${days} jour(s)`,
        });
      }
    }

    const result = await query(
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

    // Imprévus : déduire immédiatement du solde + notifications
    if (type === 'IMPRÉVU') {
      const balRes = await query(
        `SELECT balance FROM leave_balances WHERE employee_id = $1 AND year = $2`,
        [id, year]
      );
      const balance = parseFloat(balRes.rows[0]?.balance ?? '0');

      if (balance >= days) {
        await query(
          `UPDATE leave_balances SET days_taken = days_taken + $1, updated_at = NOW()
           WHERE employee_id = $2 AND year = $3`,
          [days, id, year]
        );
      } else {
        const overflow = days - Math.max(balance, 0);
        await query(
          `UPDATE leave_balances
           SET days_taken = days_taken + $1, days_unpaid = days_unpaid + $2, updated_at = NOW()
           WHERE employee_id = $3 AND year = $4`,
          [days, overflow, id, year]
        );

        // Alerte DRH : dépassement de solde
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

    logger.info(`Congé créé: ${leave.id} pour employé ${id} par ${req.user?.email}`);
    return res.status(201).json(leave);
  } catch (err) {
    logger.error('createLeave error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
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
      const carryOver = remaining - unpaid;

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

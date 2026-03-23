import cron from 'node-cron';
import { query } from '../config/database';
import { sendBirthdayAlert, sendContractExpiryAlert, sendMonthlyReport, sendLeaveEndAlert } from '../services/emailService';
import { generateMonthlyReport } from '../services/reportService';
import { logger } from '../utils/logger';
import { yearEndRollover } from '../controllers/leavesController';

// Récupère les emails DRH/Direction
const getHREmails = async (): Promise<string[]> => {
  const result = await query(
    `SELECT email FROM users WHERE role IN ('DRH', 'DIRECTION_GENERALE') AND is_active = true`
  );
  return result.rows.map((r: { email: string }) => r.email).filter(Boolean);
};

// ============================================================
// ALERTES ANNIVERSAIRES — tous les jours à 8h00
// ============================================================
export const scheduleBirthdayAlerts = () => {
  cron.schedule('0 8 * * *', async () => {
    logger.info('[CRON] Vérification anniversaires...');
    try {
      const hrEmails = await getHREmails();
      if (!hrEmails.length) return;

      // Anniversaires demain
      const tomorrow = await query(`
        SELECT first_name, last_name
        FROM employees
        WHERE status = 'ACTIF'
          AND TO_CHAR(birth_date, 'MM-DD') = TO_CHAR(CURRENT_DATE + INTERVAL '1 day', 'MM-DD')
      `);

      for (const emp of tomorrow.rows) {
        const name = `${emp.first_name} ${emp.last_name}`;
        for (const email of hrEmails) {
          await sendBirthdayAlert(name, email, false);
        }
        await query(
          `INSERT INTO alerts(type, employee_id, scheduled_date, status, message)
           SELECT 'BIRTHDAY', id, CURRENT_DATE + 1, 'SENT', 'Alerte anniversaire J-1 envoyée'
           FROM employees WHERE first_name = $1 AND last_name = $2 AND status = 'ACTIF'`,
          [emp.first_name, emp.last_name]
        );
      }

      // Anniversaires aujourd'hui
      const today = await query(`
        SELECT first_name, last_name
        FROM employees
        WHERE status = 'ACTIF'
          AND TO_CHAR(birth_date, 'MM-DD') = TO_CHAR(CURRENT_DATE, 'MM-DD')
      `);

      for (const emp of today.rows) {
        const name = `${emp.first_name} ${emp.last_name}`;
        for (const email of hrEmails) {
          await sendBirthdayAlert(name, email, true);
        }
      }

      logger.info(`[CRON] Anniversaires: ${tomorrow.rows.length} demain, ${today.rows.length} aujourd'hui`);
    } catch (err) {
      logger.error('[CRON] Erreur anniversaires:', err);
    }
  });
};

// ============================================================
// ALERTES CONTRATS — tous les jours à 9h00
// ============================================================
export const scheduleContractAlerts = () => {
  cron.schedule('0 9 * * *', async () => {
    logger.info('[CRON] Vérification échéances contrats...');
    try {
      const hrEmails = await getHREmails();
      if (!hrEmails.length) return;

      // CDD: alertes à 60 et 30 jours
      const cddAlerts = await query(`
        SELECT id, matricule, first_name, last_name, contract_type, exit_date,
          EXTRACT(DAY FROM exit_date - CURRENT_DATE) as days_remaining
        FROM employees
        WHERE status = 'ACTIF'
          AND contract_type = 'CDD'
          AND exit_date IS NOT NULL
          AND EXTRACT(DAY FROM exit_date - CURRENT_DATE) IN (60, 30)
      `);

      // STAGE: alerte à 15 jours
      const stageAlerts = await query(`
        SELECT id, matricule, first_name, last_name, contract_type, exit_date,
          EXTRACT(DAY FROM exit_date - CURRENT_DATE) as days_remaining
        FROM employees
        WHERE status = 'ACTIF'
          AND contract_type = 'STAGE'
          AND exit_date IS NOT NULL
          AND EXTRACT(DAY FROM exit_date - CURRENT_DATE) = 15
      `);

      const allAlerts = [...cddAlerts.rows, ...stageAlerts.rows];

      for (const emp of allAlerts) {
        const name = `${emp.first_name} ${emp.last_name}`;
        const expiryDate = new Date(emp.exit_date).toLocaleDateString('fr-FR');
        await sendContractExpiryAlert(
          name,
          emp.contract_type,
          expiryDate,
          parseInt(emp.days_remaining),
          hrEmails
        );

        await query(
          `INSERT INTO alerts(type, employee_id, scheduled_date, status, message)
           VALUES('CONTRACT_END', $1, CURRENT_DATE, 'SENT', $2)`,
          [emp.id, `Alerte ${emp.days_remaining} jours avant fin de contrat`]
        );
      }

      logger.info(`[CRON] Contrats: ${allAlerts.length} alertes envoyées`);
    } catch (err) {
      logger.error('[CRON] Erreur contrats:', err);
    }
  });
};

// ============================================================
// RAPPORT MENSUEL — du 1er au 5 du mois à 7h00
// ============================================================
export const scheduleMonthlyReport = () => {
  cron.schedule('0 7 1-5 * *', async () => {
    const now = new Date();
    const reportMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // mois précédent
    const reportYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    logger.info(`[CRON] Génération rapport mensuel ${reportMonth}/${reportYear}...`);

    try {
      // Éviter les doublons
      const existing = await query(
        `SELECT id FROM reports WHERE year = $1 AND month = $2 AND status = 'SENT'`,
        [reportYear, reportMonth]
      );
      if (existing.rows[0]) {
        logger.info('[CRON] Rapport déjà envoyé ce mois');
        return;
      }

      const hrEmails = await getHREmails();
      const filePath = await generateMonthlyReport(reportYear, reportMonth);

      await sendMonthlyReport(reportYear, reportMonth, filePath, hrEmails);

      await query(
        `INSERT INTO reports(name, year, month, file_path, generated_at, sent_at, status)
         VALUES($1,$2,$3,$4,NOW(),NOW(),'SENT')`,
        [`Données_du_mois_RH_${reportYear}_${String(reportMonth).padStart(2, '0')}.xlsx`, reportYear, reportMonth, filePath]
      );

      logger.info(`[CRON] Rapport mensuel envoyé: ${filePath}`);
    } catch (err) {
      logger.error('[CRON] Erreur rapport mensuel:', err);
    }
  });
};

// ============================================================
// REPORT FIN D'ANNÉE CONGÉS — 31 décembre à 23h00
// ============================================================
export const scheduleYearEndRollover = () => {
  cron.schedule('0 23 31 12 *', async () => {
    logger.info('[CRON] Report fin d\'année des congés...');
    await yearEndRollover();
  });
};

// ============================================================
// ALERTE FIN DE CONGÉ — tous les jours à 8h30
// ============================================================
export const scheduleLeaveEndAlerts = () => {
  cron.schedule('30 8 * * *', async () => {
    logger.info('[CRON] Vérification fins de congés...');
    try {
      // Congés approuvés se terminant dans 3 jours
      const in3days = await query(`
        SELECT l.end_date,
          e.first_name, e.last_name, e.email as employee_email,
          u_mgr.email as manager_email
        FROM leaves l
        JOIN employees e ON e.id = l.employee_id
        LEFT JOIN employees mgr ON mgr.id = e.manager_id
        LEFT JOIN users u_mgr ON u_mgr.email = mgr.email
        WHERE l.type = 'PLANIFIE' AND l.status = 'APPROUVE'
          AND l.end_date = CURRENT_DATE + INTERVAL '3 days'
      `);

      for (const leave of in3days.rows) {
        const name = `${leave.first_name} ${leave.last_name}`;
        const endDateFr = new Date(leave.end_date).toLocaleDateString('fr-FR');

        await sendLeaveEndAlert(
          name,
          endDateFr,
          leave.manager_email || null,
          leave.employee_email || null
        );

        logger.info(`[ALERTE] Fin de congé dans 3 jours: ${name} le ${leave.end_date}`);
      }

      logger.info(`[CRON] Alertes fins de congés: ${in3days.rows.length} envoyées`);
    } catch (err) {
      logger.error('[CRON] Erreur alerte fins de congés:', err);
    }
  });
};

export const initScheduler = () => {
  scheduleBirthdayAlerts();
  scheduleContractAlerts();
  scheduleMonthlyReport();
  scheduleYearEndRollover();
  scheduleLeaveEndAlerts();
  logger.info('Scheduler initialisé (anniversaires, contrats, rapports, congés)');
};

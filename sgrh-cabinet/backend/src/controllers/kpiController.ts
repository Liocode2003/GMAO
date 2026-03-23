import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const [
      totalActive,
      byServiceLine,
      byGender,
      byContractType,
      byAgeGroup,
      bySeason,
      withEmail,
      birthdaysThisMonth,
      contractsToRenew,
    ] = await Promise.all([
      // Total actif
      query(`SELECT COUNT(*) as total FROM employees WHERE status = 'ACTIF'`),

      // Par ligne de service
      query(`
        SELECT service_line, COUNT(*) as count
        FROM employees WHERE status = 'ACTIF'
        GROUP BY service_line ORDER BY count DESC
      `),

      // Par genre
      query(`
        SELECT gender, COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
        FROM employees WHERE status = 'ACTIF'
        GROUP BY gender
      `),

      // Par type de contrat
      query(`
        SELECT contract_type, COUNT(*) as count
        FROM employees WHERE status = 'ACTIF'
        GROUP BY contract_type
      `),

      // Tranches d'âge
      query(`
        SELECT
          CASE
            WHEN DATE_PART('year', AGE(birth_date)) < 25 THEN 'moins_25'
            WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 25 AND 35 THEN '25_35'
            WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 36 AND 45 THEN '36_45'
            ELSE 'plus_45'
          END as age_group,
          COUNT(*) as count
        FROM employees WHERE status = 'ACTIF'
        GROUP BY age_group
      `),

      // Par saison
      query(`
        SELECT EXTRACT(YEAR FROM entry_date) as season, COUNT(*) as count
        FROM employees WHERE status = 'ACTIF'
        GROUP BY season ORDER BY season DESC
      `),

      // Avec email
      query(`SELECT COUNT(*) as count FROM employees WHERE status = 'ACTIF' AND email IS NOT NULL`),

      // Anniversaires du mois
      query(`
        SELECT id, first_name, last_name, birth_date,
          DATE_PART('year', AGE(birth_date)) + 1 as upcoming_age,
          TO_CHAR(birth_date, 'DD/MM') as birth_day_month
        FROM employees
        WHERE status = 'ACTIF'
          AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        ORDER BY EXTRACT(DAY FROM birth_date)
      `),

      // Contrats à renouveler dans le mois
      query(`
        SELECT id, matricule, first_name, last_name, contract_type,
          exit_date,
          (exit_date - CURRENT_DATE) as days_remaining
        FROM employees
        WHERE status = 'ACTIF'
          AND exit_date IS NOT NULL
          AND exit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        ORDER BY exit_date
      `),
    ]);

    const canViewAmounts = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'].includes(req.user?.role || '');
    const commercialWidget = await query(
      `SELECT
        COUNT(*) FILTER (WHERE type = 'AMI'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS ami_this_month,
        COUNT(*) FILTER (WHERE type = 'APPEL_OFFRE'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS ao_this_month,
        COUNT(*) FILTER (WHERE status = 'GAGNE'
          AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)) AS wins_this_month,
        ${canViewAmounts
          ? `COALESCE(SUM(contract_amount) FILTER (WHERE status = 'GAGNE'
              AND EXTRACT(YEAR FROM submission_date) = EXTRACT(YEAR FROM CURRENT_DATE)
              AND EXTRACT(MONTH FROM submission_date) = EXTRACT(MONTH FROM CURRENT_DATE)), 0) AS amount_this_month`
          : `0 AS amount_this_month`}
       FROM commercial_submissions`
    );

    return res.json({
      totalActive: parseInt(totalActive.rows[0].total),
      byServiceLine: byServiceLine.rows,
      byGender: byGender.rows,
      byContractType: byContractType.rows,
      byAgeGroup: byAgeGroup.rows,
      bySeason: bySeason.rows,
      withEmail: parseInt(withEmail.rows[0].count),
      birthdaysThisMonth: birthdaysThisMonth.rows,
      contractsToRenew: contractsToRenew.rows,
      commercial: commercialWidget.rows[0],
    });
  } catch (err) {
    logger.error('getDashboard error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getKPIs = async (req: Request, res: Response) => {
  const { year = new Date().getFullYear().toString(), month } = req.query as Record<string, string>;

  try {
    // Effectifs globaux
    const headcount = await query(`
      SELECT
        COUNT(*) FILTER (WHERE contract_type IN ('CDI','CDD')) as permanent,
        COUNT(*) FILTER (WHERE contract_type = 'CDI') as cdi,
        COUNT(*) FILTER (WHERE contract_type = 'CDD') as cdd,
        COUNT(*) FILTER (WHERE contract_type = 'STAGE') as stagiaires,
        COUNT(*) FILTER (WHERE contract_type IN ('CONSULTANT','FREELANCE')) as prestataires,
        COUNT(*) FILTER (WHERE function = 'ASSOCIE' AND is_expatriate = true) as associes_carl,
        COUNT(*) FILTER (WHERE function = 'ASSOCIE' AND is_expatriate = false) as associes_local,
        COUNT(*) FILTER (WHERE gender = 'M') as hommes,
        COUNT(*) FILTER (WHERE gender = 'F') as femmes,
        COUNT(*) as total
      FROM employees
      WHERE status = 'ACTIF'
        AND EXTRACT(YEAR FROM entry_date) <= $1
        AND (exit_date IS NULL OR EXTRACT(YEAR FROM exit_date) >= $1)
    `, [year]);

    // Mouvements du mois
    const monthFilter = month ? `AND EXTRACT(MONTH FROM entry_date) = ${month}` : '';
    const movements = await query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM entry_date) = $1 ${monthFilter}) as entries,
        COUNT(*) FILTER (WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $1 ${monthFilter}) as exits
      FROM employees
    `, [year]);

    // Formations
    const trainings = await query(`
      SELECT
        t.type,
        COUNT(t.id) as count,
        COALESCE(SUM(t.duration_hours), 0) as total_hours,
        COALESCE(SUM(t.budget), 0) as total_budget
      FROM trainings t
      WHERE EXTRACT(YEAR FROM t.date) = $1
        ${month ? `AND EXTRACT(MONTH FROM t.date) = ${month}` : ''}
      GROUP BY t.type
    `, [year]);

    // Total heures formation
    const totalTrainingHours = await query(`
      SELECT COALESCE(SUM(duration_hours), 0) as total
      FROM trainings
      WHERE EXTRACT(YEAR FROM date) = $1
    `, [year]);

    // Effectifs par ligne de service et grade
    const byServiceAndGrade = await query(`
      SELECT service_line, grade, COUNT(*) as count
      FROM employees
      WHERE status = 'ACTIF'
      GROUP BY service_line, grade
      ORDER BY service_line, grade
    `);

    // Diplômes — depuis la table employee_diplomas
    const diplomas = await query(`
      SELECT ed.diploma_type, COUNT(*) as count
      FROM employee_diplomas ed
      JOIN employees e ON e.id = ed.employee_id
      WHERE e.status = 'ACTIF'
      GROUP BY ed.diploma_type
      ORDER BY count DESC
    `);

    // Par grade
    const byGrade = await query(`
      SELECT grade, COUNT(*) as count
      FROM employees WHERE status = 'ACTIF'
      GROUP BY grade ORDER BY grade
    `);

    // Turnover
    const turnover = await query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM entry_date) = $1) as entries,
        COUNT(*) FILTER (WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $1) as exits
      FROM employees
    `, [year]);

    // Mobilités internes
    const mobilities = await query(`
      SELECT COUNT(*) as count
      FROM internal_mobilities
      WHERE EXTRACT(YEAR FROM effective_date) = $1
    `, [year]);

    // Targets
    const targets = await query(
      `SELECT indicator_key, target_value FROM kpi_targets WHERE year = $1`,
      [year]
    );

    const targetsMap: Record<string, number> = {};
    targets.rows.forEach((t) => { targetsMap[t.indicator_key] = t.target_value; });

    return res.json({
      year: parseInt(year),
      month: month ? parseInt(month) : null,
      headcount: headcount.rows[0],
      movements: movements.rows[0],
      trainings: trainings.rows,
      totalTrainingHours: parseFloat(totalTrainingHours.rows[0].total),
      byServiceAndGrade: byServiceAndGrade.rows,
      diplomas: diplomas.rows,
      byGrade: byGrade.rows,
      turnover: turnover.rows[0],
      mobilitiesCount: parseInt(mobilities.rows[0].count),
      targets: targetsMap,
    });
  } catch (err) {
    logger.error('getKPIs error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getMonthlyKPIs = async (req: Request, res: Response) => {
  const { year = new Date().getFullYear().toString() } = req.query as Record<string, string>;

  try {
    const monthlyData = [];
    for (let m = 1; m <= 12; m++) {
      const entries = await query(`
        SELECT COUNT(*) as count FROM employees
        WHERE EXTRACT(YEAR FROM entry_date) = $1 AND EXTRACT(MONTH FROM entry_date) = $2
      `, [year, m]);

      const exits = await query(`
        SELECT COUNT(*) as count FROM employees
        WHERE exit_date IS NOT NULL
          AND EXTRACT(YEAR FROM exit_date) = $1 AND EXTRACT(MONTH FROM exit_date) = $2
      `, [year, m]);

      const trainingHours = await query(`
        SELECT COALESCE(SUM(duration_hours), 0) as hours FROM trainings
        WHERE EXTRACT(YEAR FROM date) = $1 AND EXTRACT(MONTH FROM date) = $2
      `, [year, m]);

      monthlyData.push({
        month: m,
        entries: parseInt(entries.rows[0].count),
        exits: parseInt(exits.rows[0].count),
        trainingHours: parseFloat(trainingHours.rows[0].hours),
      });
    }

    return res.json({ year: parseInt(year), monthly: monthlyData });
  } catch (err) {
    logger.error('getMonthlyKPIs error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

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
      birthdaysThisMonth,
      contractsToRenew,
      turnoverData,
    ] = await Promise.all([
      // Total actif (hors stagiaires)
      query(`SELECT COUNT(*) as total FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'`),

      // Par ligne de service (hors stagiaires)
      query(`
        SELECT service_line, COUNT(*) as count
        FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'
        GROUP BY service_line ORDER BY count DESC
      `),

      // Par genre
      query(`
        SELECT gender, COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 1) as percentage
        FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'
        GROUP BY gender
      `),

      // Par type de contrat
      query(`
        SELECT contract_type, COUNT(*) as count
        FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
        GROUP BY contract_type ORDER BY count DESC
      `),

      // Tranches d'âge : 20-30, 30-40, 40-50, 50+
      query(`
        SELECT
          CASE
            WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 20 AND 29 THEN '20_30'
            WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 30 AND 39 THEN '30_40'
            WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 40 AND 49 THEN '40_50'
            ELSE 'plus_50'
          END as age_group,
          COUNT(*) as count
        FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'
        GROUP BY age_group
      `),

      // Par saison
      query(`
        SELECT EXTRACT(YEAR FROM entry_date) as season, COUNT(*) as count
        FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'
        GROUP BY season ORDER BY season DESC
      `),

      // Anniversaires du mois
      query(`
        SELECT id, first_name, last_name, birth_date,
          DATE_PART('year', AGE(birth_date)) + 1 as upcoming_age,
          TO_CHAR(birth_date, 'DD/MM') as birth_day_month
        FROM employees
        WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
          AND EXTRACT(MONTH FROM birth_date) = EXTRACT(MONTH FROM CURRENT_DATE)
        ORDER BY EXTRACT(DAY FROM birth_date)
      `),

      // Contrats à renouveler dans les 30 jours
      query(`
        SELECT id, matricule, first_name, last_name, contract_type,
          exit_date,
          (exit_date - CURRENT_DATE) as days_remaining
        FROM employees
        WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
          AND exit_date IS NOT NULL
          AND exit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'
        ORDER BY exit_date
      `),

      // Turnover année en cours (hors stagiaires) — formule : départs / effectif_moyen × 100
      query(`
        SELECT
          COUNT(*) FILTER (WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as exits_ytd,
          COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM entry_date) = EXTRACT(YEAR FROM CURRENT_DATE)) as entries_ytd,
          COUNT(*) FILTER (WHERE exit_date IS NULL OR exit_date > CURRENT_DATE) as headcount_current,
          COUNT(*) FILTER (WHERE entry_date < DATE_TRUNC('year', CURRENT_DATE)
            AND (exit_date IS NULL OR exit_date >= DATE_TRUNC('year', CURRENT_DATE))) as headcount_start
        FROM employees
        WHERE contract_type NOT IN ('STAGE', 'CONSULTANT', 'FREELANCE')
      `),
    ]);

    const canViewAmounts = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'].includes((req.user as { role?: string })?.role || '');
    let commercialWidget = null;
    try {
      const cw = await query(
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
      commercialWidget = cw.rows[0];
    } catch (_err) {
      // table non encore créée — widget ignoré
    }

    const exitsYtd = parseInt(turnoverData.rows[0].exits_ytd) || 0;
    const headcountCurrent = parseInt(turnoverData.rows[0].headcount_current) || 0;
    const headcountStart   = parseInt(turnoverData.rows[0].headcount_start)   || 0;
    const avgHeadcount = ((headcountStart + headcountCurrent) / 2) || 1;
    const turnoverRate = Math.round((exitsYtd / avgHeadcount) * 100 * 10) / 10;

    return res.json({
      totalActive: parseInt(totalActive.rows[0].total),
      byServiceLine: byServiceLine.rows,
      byGender: byGender.rows,
      byContractType: byContractType.rows,
      byAgeGroup: byAgeGroup.rows,
      bySeason: bySeason.rows,
      birthdaysThisMonth: birthdaysThisMonth.rows,
      contractsToRenew: contractsToRenew.rows,
      turnover: {
        rate: turnoverRate,
        exits: exitsYtd,
        entries: parseInt(turnoverData.rows[0].entries_ytd) || 0,
      },
      commercial: commercialWidget,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('getDashboard error — ' + msg, err);
    return res.status(500).json({ error: `Erreur tableau de bord: ${msg}` });
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
      WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
        AND EXTRACT(YEAR FROM entry_date) <= $1
        AND (exit_date IS NULL OR EXTRACT(YEAR FROM exit_date) >= $1)
    `, [year]);

    // Mouvements du mois
    const movementsParams: unknown[] = [year];
    let monthFilter = '';
    if (month) {
      movementsParams.push(parseInt(month));
      monthFilter = `AND EXTRACT(MONTH FROM entry_date) = $${movementsParams.length}`;
    }
    const movements = await query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM entry_date) = $1 ${monthFilter}) as entries,
        COUNT(*) FILTER (WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $1 ${monthFilter}) as exits
      FROM employees
    `, movementsParams);

    // Formations
    const trainingsParams: unknown[] = [year];
    let trainingsMonthFilter = '';
    if (month) {
      trainingsParams.push(parseInt(month));
      trainingsMonthFilter = `AND EXTRACT(MONTH FROM t.date) = $${trainingsParams.length}`;
    }
    const trainings = await query(`
      SELECT
        t.type,
        COUNT(t.id) as count,
        COALESCE(SUM(t.duration_hours), 0) as total_hours,
        COALESCE(SUM(t.budget), 0) as total_budget
      FROM trainings t
      WHERE EXTRACT(YEAR FROM t.date) = $1
        ${trainingsMonthFilter}
      GROUP BY t.type
    `, trainingsParams);

    // Total heures formation
    const totalTrainingHours = await query(`
      SELECT COALESCE(SUM(duration_hours), 0) as total
      FROM trainings
      WHERE EXTRACT(YEAR FROM date) = $1
    `, [year]);

    // Effectifs par ligne de service et grade (hors stagiaires)
    const byServiceAndGrade = await query(`
      SELECT service_line, grade, COUNT(*) as count
      FROM employees
      WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE) AND entry_date <= CURRENT_DATE AND contract_type != 'STAGE'
      GROUP BY service_line, grade
      ORDER BY service_line, grade
    `);

    // Par grade
    const byGrade = await query(`
      SELECT grade, COUNT(*) as count
      FROM employees WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
      GROUP BY grade ORDER BY grade
    `);

    // Turnover — formule : départs / effectif_moyen × 100
    const turnover = await query(`
      SELECT
        COUNT(*) FILTER (WHERE EXTRACT(YEAR FROM entry_date) = $1) as entries,
        COUNT(*) FILTER (WHERE exit_date IS NOT NULL AND EXTRACT(YEAR FROM exit_date) = $1) as exits,
        COUNT(*) FILTER (WHERE entry_date < MAKE_DATE($1::int, 1, 1)
          AND (exit_date IS NULL OR exit_date >= MAKE_DATE($1::int, 1, 1))
          AND contract_type NOT IN ('STAGE','CONSULTANT','FREELANCE')) as headcount_start,
        COUNT(*) FILTER (WHERE (exit_date IS NULL OR exit_date > CURRENT_DATE)
          AND contract_type NOT IN ('STAGE','CONSULTANT','FREELANCE')) as headcount_end
      FROM employees
    `, [year]);

    // Targets
    const targets = await query(
      `SELECT indicator_key, target_value FROM kpi_targets WHERE year = $1`,
      [year]
    );

    // Tables optionnelles : ne pas crasher si elles n'existent pas encore
    let diplomasRows: unknown[] = [];
    try {
      const diplomas = await query(`
        SELECT ed.diploma_type, COUNT(*) as count
        FROM employee_diplomas ed
        JOIN employees e ON e.id = ed.employee_id
        WHERE (e.exit_date IS NULL OR e.exit_date > CURRENT_DATE)
        GROUP BY ed.diploma_type ORDER BY count DESC
      `);
      diplomasRows = diplomas.rows;
    } catch { logger.warn('employee_diplomas non disponible'); }

    let mobilitiesCount = 0;
    try {
      const mobilities = await query(`
        SELECT COUNT(*) as count FROM internal_mobilities
        WHERE EXTRACT(YEAR FROM effective_date) = $1
      `, [year]);
      mobilitiesCount = parseInt(mobilities.rows[0].count);
    } catch { logger.warn('internal_mobilities non disponible'); }

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
      diplomas: diplomasRows,
      byGrade: byGrade.rows,
      turnover: turnover.rows[0],
      turnoverRate: (() => {
        const exits = parseInt(turnover.rows[0].exits) || 0;
        const hStart = parseInt(turnover.rows[0].headcount_start) || 0;
        const hEnd   = parseInt(turnover.rows[0].headcount_end)   || 0;
        const avg = (hStart + hEnd) / 2 || 1;
        return Math.round((exits / avg) * 100 * 10) / 10;
      })(),
      mobilitiesCount,
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

import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';

// Effectif actif à une date donnée (hors STAGE)
async function headcountAt(date: string, functionalOnly = false): Promise<number> {
  const contractFilter = functionalOnly
    ? `AND contract_type IN ('CDI', 'CDD')`
    : `AND contract_type NOT IN ('STAGE')`;
  const res = await query(
    `SELECT COUNT(*) as n FROM employees
     WHERE entry_date <= $1
       AND (exit_date IS NULL OR exit_date > $1)
       ${contractFilter}`,
    [date]
  );
  return parseInt(res.rows[0].n) || 0;
}

// Départs sur une période (hors STAGE)
async function departuresBetween(from: string, to: string, functionalOnly = false): Promise<number> {
  const contractFilter = functionalOnly
    ? `AND contract_type IN ('CDI', 'CDD')`
    : `AND contract_type NOT IN ('STAGE')`;
  const res = await query(
    `SELECT COUNT(*) as n FROM employees
     WHERE exit_date BETWEEN $1 AND $2
       ${contractFilter}`,
    [from, to]
  );
  return parseInt(res.rows[0].n) || 0;
}

// Turnover = départs / ((effectif_début + effectif_fin) / 2) × 100
function computeTurnover(departures: number, headStart: number, headEnd: number): number {
  const avg = (headStart + headEnd) / 2;
  if (avg === 0) return 0;
  return Math.round((departures / avg) * 100 * 10) / 10; // arrondi 1 décimale
}

export const getHRReport = async (req: Request, res: Response) => {
  // Paramètres : year=2026&month=5  →  période Jan–Mai de l'année
  const year = parseInt((req.query.year as string) || String(new Date().getFullYear()));
  const month = parseInt((req.query.month as string) || String(new Date().getMonth() + 1));

  const endDate   = `${year}-${String(month).padStart(2, '0')}-31`;       // fin de période
  const startDate = `${year}-01-01`;                                        // début de l'année
  const prevEndDate   = `${year - 1}-${String(month).padStart(2, '0')}-31`;
  const prevStartDate = `${year - 1}-01-01`;

  // Correctif : utiliser le dernier jour réel du mois
  const endDateReal     = new Date(year, month, 0).toISOString().split('T')[0];
  const prevEndDateReal = new Date(year - 1, month, 0).toISOString().split('T')[0];

  try {
    const [
      headCurrent,
      headPrev,
      genderCurrent,
      genderPrev,
      deptCurrent,
      deptPrev,
      ageCurrent,
      departureCurrent,
      departurePrev,
      departureFuncCurrent,
      departureFuncPrev,
      headStartCurrent,
      headStartPrev,
      headStartFuncCurrent,
      headStartFuncPrev,
      headEndFuncCurrent,
      headEndFuncPrev,
      departureReasonsCurrent,
      departureReasonsPrev,
    ] = await Promise.all([
      // Effectifs totaux (hors STAGE)
      headcountAt(endDateReal),
      headcountAt(prevEndDateReal),

      // Répartition H/F — période courante
      query(
        `SELECT gender, COUNT(*) as n FROM employees
         WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
           AND contract_type NOT IN ('STAGE')
         GROUP BY gender`,
        [endDateReal]
      ),
      // Répartition H/F — période précédente
      query(
        `SELECT gender, COUNT(*) as n FROM employees
         WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
           AND contract_type NOT IN ('STAGE')
         GROUP BY gender`,
        [prevEndDateReal]
      ),

      // Effectifs par département — période courante
      query(
        `SELECT service_line, COUNT(*) as n FROM employees
         WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
           AND contract_type NOT IN ('STAGE')
         GROUP BY service_line ORDER BY n DESC`,
        [endDateReal]
      ),
      // Effectifs par département — période précédente
      query(
        `SELECT service_line, COUNT(*) as n FROM employees
         WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
           AND contract_type NOT IN ('STAGE')
         GROUP BY service_line ORDER BY n DESC`,
        [prevEndDateReal]
      ),

      // Tranches d'âge — période courante uniquement
      query(
        `SELECT
           CASE
             WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 20 AND 29 THEN '20-30 ans'
             WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 30 AND 39 THEN '30-40 ans'
             WHEN DATE_PART('year', AGE(birth_date)) BETWEEN 40 AND 49 THEN '40-50 ans'
             ELSE '+50 ans'
           END as age_group,
           COUNT(*) as n
         FROM employees
         WHERE entry_date <= $1 AND (exit_date IS NULL OR exit_date > $1)
           AND contract_type NOT IN ('STAGE') AND birth_date IS NOT NULL
         GROUP BY age_group`,
        [endDateReal]
      ),

      // Départs Jan→fin mois — global (hors STAGE)
      departuresBetween(startDate, endDateReal),
      departuresBetween(prevStartDate, prevEndDateReal),

      // Départs Jan→fin mois — fonctionnel (CDI/CDD)
      departuresBetween(startDate, endDateReal, true),
      departuresBetween(prevStartDate, prevEndDateReal, true),

      // Effectifs début de période (01/01) — global
      headcountAt(startDate),
      headcountAt(prevStartDate),

      // Effectifs début de période — fonctionnel
      headcountAt(startDate, true),
      headcountAt(prevStartDate, true),

      // Effectifs fin de période — fonctionnel
      headcountAt(endDateReal, true),
      headcountAt(prevEndDateReal, true),

      // Motifs de départ — période courante
      query(
        `SELECT
           COALESCE(departure_reason, 'AUTRES') as reason,
           COUNT(*) as n
         FROM employees
         WHERE exit_date BETWEEN $1 AND $2
           AND contract_type NOT IN ('STAGE')
         GROUP BY reason ORDER BY n DESC`,
        [startDate, endDateReal]
      ),
      // Motifs de départ — période précédente
      query(
        `SELECT
           COALESCE(departure_reason, 'AUTRES') as reason,
           COUNT(*) as n
         FROM employees
         WHERE exit_date BETWEEN $1 AND $2
           AND contract_type NOT IN ('STAGE')
         GROUP BY reason ORDER BY n DESC`,
        [prevStartDate, prevEndDateReal]
      ),
    ]);

    const headStartCurrentVal = headStartCurrent;
    const headStartPrevVal    = headStartPrev;

    const turnoverGlobalCurrent   = computeTurnover(departureCurrent,     headStartCurrentVal, headCurrent);
    const turnoverGlobalPrev      = computeTurnover(departurePrev,         headStartPrevVal,    headPrev);
    const turnoverFuncCurrent     = computeTurnover(departureFuncCurrent,  headStartFuncCurrent, headEndFuncCurrent);
    const turnoverFuncPrev        = computeTurnover(departureFuncPrev,     headStartFuncPrev,    headEndFuncPrev);

    const toGenderMap = (rows: { gender: string; n: string }[]) => {
      const m = { M: 0, F: 0 };
      rows.forEach(r => { m[r.gender as 'M' | 'F'] = parseInt(r.n) || 0; });
      return m;
    };

    const toDeptMap = (rows: { service_line: string; n: string }[]) =>
      rows.map(r => ({ service_line: r.service_line, count: parseInt(r.n) || 0 }));

    const REASON_ORDER = ['NOUVELLES_OPPORTUNITES', 'RAISONS_PERSONNELLES', 'REMUNERATION', 'MANAGEMENT', 'AUTRES'];
    const toReasonsMap = (rows: { reason: string; n: string }[], totalDepartures: number) => {
      const m: Record<string, number> = {};
      rows.forEach(r => { m[r.reason] = parseInt(r.n) || 0; });
      return REASON_ORDER.map(reason => ({
        reason,
        count: m[reason] || 0,
        pct: totalDepartures > 0 ? Math.round(((m[reason] || 0) / totalDepartures) * 100) : 0,
      }));
    };

    return res.json({
      period: { year, month, endDate: endDateReal },
      prevPeriod: { year: year - 1, month, endDate: prevEndDateReal },

      headcount: {
        current: headCurrent,
        prev: headPrev,
        delta: headCurrent - headPrev,
      },
      gender: {
        current: toGenderMap(genderCurrent.rows as { gender: string; n: string }[]),
        prev:    toGenderMap(genderPrev.rows as { gender: string; n: string }[]),
      },
      byDepartment: {
        current: toDeptMap(deptCurrent.rows as { service_line: string; n: string }[]),
        prev:    toDeptMap(deptPrev.rows as { service_line: string; n: string }[]),
      },
      ageGroups: (ageCurrent.rows as { age_group: string; n: string }[]).map(r => ({
        label: r.age_group,
        count: parseInt(r.n) || 0,
      })),
      turnover: {
        global: {
          current: {
            departures: departureCurrent,
            headStart: headStartCurrentVal,
            headEnd: headCurrent,
            avgHead: Math.round((headStartCurrentVal + headCurrent) / 2 * 10) / 10,
            rate: turnoverGlobalCurrent,
          },
          prev: {
            departures: departurePrev,
            headStart: headStartPrevVal,
            headEnd: headPrev,
            avgHead: Math.round((headStartPrevVal + headPrev) / 2 * 10) / 10,
            rate: turnoverGlobalPrev,
          },
        },
        functional: {
          current: {
            departures: departureFuncCurrent,
            headStart: headStartFuncCurrent,
            headEnd: headEndFuncCurrent,
            avgHead: Math.round((headStartFuncCurrent + headEndFuncCurrent) / 2 * 10) / 10,
            rate: turnoverFuncCurrent,
          },
          prev: {
            departures: departureFuncPrev,
            headStart: headStartFuncPrev,
            headEnd: headEndFuncPrev,
            avgHead: Math.round((headStartFuncPrev + headEndFuncPrev) / 2 * 10) / 10,
            rate: turnoverFuncPrev,
          },
        },
      },
      departureReasons: {
        current: toReasonsMap(departureReasonsCurrent.rows as { reason: string; n: string }[], departureCurrent),
        prev:    toReasonsMap(departureReasonsPrev.rows as { reason: string; n: string }[], departurePrev),
      },
    });
  } catch (err) {
    logger.error('getHRReport error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

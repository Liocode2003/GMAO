import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

const SALARY_ROLES: UserRole[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];

const canViewSalary = (role?: UserRole) => role && SALARY_ROLES.includes(role);
const canViewBirthDate = (role?: UserRole) =>
  role && ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER'].includes(role as UserRole);

const sanitizeEmployee = (emp: Record<string, unknown>, role?: UserRole) => {
  const result = { ...emp };
  if (!canViewSalary(role)) delete result.salary;
  if (!canViewBirthDate(role)) {
    result.birth_date = undefined;
    result.age = undefined;
  }
  return result;
};

// Calcul ancienneté
const calcSeniority = (entryDate: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(entryDate).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  return { years, months, label: `${years} an(s) ${months} mois` };
};

export const listEmployees = async (req: Request, res: Response) => {
  const {
    search,
    service_line,
    grade,
    function: fn,
    contract_type,
    status,
    gender,
    age_min,
    age_max,
    season,
    has_email,
    page = '1',
    limit = '20',
    sort = 'last_name',
    order = 'asc',
  } = req.query as Record<string, string>;

  const offset = (parseInt(page) - 1) * parseInt(limit);
  const conditions: string[] = [];
  const params: unknown[] = [];
  let pi = 1;

  if (search) {
    conditions.push(`(e.first_name ILIKE $${pi} OR e.last_name ILIKE $${pi} OR e.matricule ILIKE $${pi} OR e.email ILIKE $${pi})`);
    params.push(`%${search}%`);
    pi++;
  }
  if (service_line) { conditions.push(`e.service_line = $${pi++}`); params.push(service_line); }
  if (grade) { conditions.push(`e.grade = $${pi++}`); params.push(grade); }
  if (fn) { conditions.push(`e.function = $${pi++}`); params.push(fn); }
  if (contract_type) { conditions.push(`e.contract_type = $${pi++}`); params.push(contract_type); }
  if (status) { conditions.push(`e.status = $${pi++}`); params.push(status); }
  if (gender) { conditions.push(`e.gender = $${pi++}`); params.push(gender); }
  if (season) { conditions.push(`EXTRACT(YEAR FROM e.entry_date) = $${pi++}`); params.push(season); }
  if (has_email === 'true') { conditions.push('e.email IS NOT NULL'); }
  if (has_email === 'false') { conditions.push('e.email IS NULL'); }
  if (age_min) { conditions.push(`DATE_PART('year', AGE(e.birth_date)) >= $${pi++}`); params.push(age_min); }
  if (age_max) { conditions.push(`DATE_PART('year', AGE(e.birth_date)) <= $${pi++}`); params.push(age_max); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const allowedSort = ['last_name', 'first_name', 'matricule', 'entry_date', 'grade', 'service_line', 'contract_type'];
  const sortCol = allowedSort.includes(sort) ? sort : 'last_name';
  const sortOrder = order === 'desc' ? 'DESC' : 'ASC';

  try {
    const countRes = await query(`SELECT COUNT(*) FROM employees e ${where}`, params);
    const total = parseInt(countRes.rows[0].count);

    params.push(parseInt(limit), offset);
    const dataRes = await query(
      `SELECT e.*,
         DATE_PART('year', AGE(e.birth_date)) as age,
         EXTRACT(YEAR FROM e.entry_date) as season
       FROM employees e
       ${where}
       ORDER BY e.${sortCol} ${sortOrder}
       LIMIT $${pi++} OFFSET $${pi++}`,
      params
    );

    const employees = dataRes.rows.map((emp) => {
      const seniority = calcSeniority(emp.entry_date);
      return sanitizeEmployee({ ...emp, seniority }, req.user?.role);
    });

    return res.json({
      data: employees,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    logger.error('listEmployees error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT e.*, DATE_PART('year', AGE(e.birth_date)) as age,
         EXTRACT(YEAR FROM e.entry_date) as season
       FROM employees e WHERE e.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });

    const emp = result.rows[0];
    const seniority = calcSeniority(emp.entry_date);

    // Log accès données sensibles
    if (canViewSalary(req.user?.role)) {
      await query(
        `INSERT INTO audit_logs(user_id, user_email, action, resource_type, resource_id, field_accessed, ip_address)
         VALUES($1,$2,'READ','employee',$3,'salary',$4)`,
        [req.user?.userId, req.user?.email, id, req.ip]
      );
    }

    return res.json(sanitizeEmployee({ ...emp, seniority }, req.user?.role));
  } catch (err) {
    logger.error('getEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  const {
    matricule, first_name, last_name, gender, email, phone, birth_date,
    function: fn, service_line, grade, contract_type, entry_date, exit_date,
    salary, status, notes, has_dec_french, has_decofi, has_other_dec,
    has_cisa, has_cfa, department, is_expatriate,
  } = req.body;

  // Check duplicates
  if (email) {
    const emailCheck = await query('SELECT id FROM employees WHERE email = $1', [email]);
    if (emailCheck.rows[0]) return res.status(409).json({ error: 'Email déjà utilisé' });
  }

  const matriculeCheck = await query('SELECT id FROM employees WHERE matricule = $1', [matricule]);
  if (matriculeCheck.rows[0]) return res.status(409).json({ error: 'Matricule déjà utilisé' });

  // Duplicate detection: same name + birth_date
  const dupCheck = await query(
    `SELECT id FROM employees WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND birth_date = $3`,
    [first_name, last_name, birth_date]
  );
  if (dupCheck.rows[0]) {
    return res.status(409).json({
      error: 'Doublon possible détecté',
      duplicate: true,
      message: `Un collaborateur avec le même nom et la même date de naissance existe déjà.`,
    });
  }

  try {
    const result = await query(
      `INSERT INTO employees (matricule, first_name, last_name, gender, email, phone, birth_date,
         function, service_line, grade, contract_type, entry_date, exit_date, salary, status, notes,
         has_dec_french, has_decofi, has_other_dec, has_cisa, has_cfa, department, is_expatriate, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
       RETURNING *`,
      [
        matricule, first_name, last_name, gender, email || null, phone || null, birth_date,
        fn, service_line, grade, contract_type, entry_date, exit_date || null,
        salary || null, status || 'ACTIF', notes || null,
        has_dec_french || false, has_decofi || false, has_other_dec || false,
        has_cisa || false, has_cfa || false, department || null,
        is_expatriate || false, req.user?.userId,
      ]
    );
    logger.info(`Nouveau collaborateur créé: ${matricule} par ${req.user?.email}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('createEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;

  // Remove protected fields
  delete updates.id;
  delete updates.created_at;
  delete updates.created_by;

  const fields = Object.keys(updates);
  if (fields.length === 0) return res.status(400).json({ error: 'Aucune modification' });

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = fields.map((f) => updates[f]);

  try {
    const result = await query(
      `UPDATE employees SET ${setClauses}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...values, id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });

    logger.info(`Collaborateur modifié: ${id} par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('updateEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deactivateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { exit_date } = req.body;

  try {
    const result = await query(
      `UPDATE employees SET status = 'INACTIF', exit_date = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [exit_date || new Date(), id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });

    logger.info(`Collaborateur désactivé: ${id} par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const getEmployeeHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT eh.*, u.first_name || ' ' || u.last_name as changed_by_name
       FROM employee_history eh
       LEFT JOIN users u ON u.id = eh.changed_by
       WHERE eh.employee_id = $1
       ORDER BY eh.created_at DESC`,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const checkDuplicates = async (req: Request, res: Response) => {
  const { first_name, last_name, birth_date, email, matricule } = req.query as Record<string, string>;
  const results: Record<string, unknown> = {};

  if (email) {
    const r = await query('SELECT id, matricule, first_name, last_name FROM employees WHERE email = $1', [email]);
    if (r.rows[0]) results.email = r.rows[0];
  }
  if (matricule) {
    const r = await query('SELECT id, first_name, last_name FROM employees WHERE matricule = $1', [matricule]);
    if (r.rows[0]) results.matricule = r.rows[0];
  }
  if (first_name && last_name && birth_date) {
    const r = await query(
      `SELECT id, matricule, email FROM employees WHERE LOWER(first_name) = LOWER($1) AND LOWER(last_name) = LOWER($2) AND birth_date = $3`,
      [first_name, last_name, birth_date]
    );
    if (r.rows[0]) results.nameAndBirthDate = r.rows[0];
  }

  return res.json({ hasDuplicates: Object.keys(results).length > 0, duplicates: results });
};

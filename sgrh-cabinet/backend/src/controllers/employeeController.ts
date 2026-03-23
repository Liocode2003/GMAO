import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import { UserRole } from '../types';

const SALARY_ROLES: UserRole[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];

const canViewSalary = (role?: UserRole) => role && SALARY_ROLES.includes(role);
const canViewBirthDate = (role?: UserRole) =>
  role && ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER'].includes(role as UserRole);

const sanitizeEmployee = (emp: Record<string, unknown>, role?: UserRole) => {
  const result = { ...emp };
  if (!canViewSalary(role)) {
    delete result.salary;
    delete result.salary_history;
  }
  if (!canViewBirthDate(role)) {
    result.birth_date = undefined;
    result.age = undefined;
  }
  return result;
};

const calcSeniority = (entryDate: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(entryDate).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  return { years, months, label: `${years} an(s) ${months} mois` };
};

// ============================================================
// LISTE DES COLLABORATEURS
// ============================================================

export const listEmployees = async (req: Request, res: Response) => {
  const {
    search, service_line, grade, function: fn, contract_type, status,
    gender, age_min, age_max, season, has_email,
    page = '1', limit = '20', sort = 'last_name', order = 'asc',
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
  // statut calculé dynamiquement
  if (status === 'ACTIF') { conditions.push('(e.exit_date IS NULL OR e.exit_date > CURRENT_DATE)'); }
  else if (status === 'INACTIF') { conditions.push('(e.exit_date IS NOT NULL AND e.exit_date <= CURRENT_DATE)'); }
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
         CASE WHEN e.exit_date IS NULL OR e.exit_date > CURRENT_DATE THEN 'ACTIF' ELSE 'INACTIF' END as status,
         DATE_PART('year', AGE(e.birth_date)) as age,
         EXTRACT(YEAR FROM e.entry_date) as season,
         m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN employees m ON m.id = e.manager_id
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

// ============================================================
// DÉTAIL COLLABORATEUR
// ============================================================

export const getEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(
      `SELECT e.*,
         CASE WHEN e.exit_date IS NULL OR e.exit_date > CURRENT_DATE THEN 'ACTIF' ELSE 'INACTIF' END as status,
         DATE_PART('year', AGE(e.birth_date)) as age,
         EXTRACT(YEAR FROM e.entry_date) as season,
         m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.id = $1`,
      [id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });

    const emp = result.rows[0];
    const seniority = calcSeniority(emp.entry_date);

    // Récupérer les diplômes depuis la table dédiée
    const diplomasRes = await query(
      `SELECT id, diploma_type, domaine FROM employee_diplomas WHERE employee_id = $1 ORDER BY created_at`,
      [id]
    );

    if (canViewSalary(req.user?.role)) {
      await query(
        `INSERT INTO audit_logs(user_id, user_email, action, resource_type, resource_id, field_accessed, ip_address)
         VALUES($1,$2,'READ','employee',$3,'salary',$4)`,
        [req.user?.userId, req.user?.email, id, req.ip]
      );
    }

    return res.json(sanitizeEmployee({ ...emp, seniority, diplomas: diplomasRes.rows }, req.user?.role));
  } catch (err) {
    logger.error('getEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// CRÉER UN COLLABORATEUR
// ============================================================

export const createEmployee = async (req: Request, res: Response) => {
  const {
    matricule, first_name, last_name, gender, email, phone, birth_date,
    function: fn, service_line, grade, contract_type, entry_date, exit_date,
    salary, notes, has_dec_french, has_decofi, has_other_dec,
    has_cisa, has_cfa, department, is_expatriate,
    manager_id, marital_status, spouse_name, spouse_phone, children_count,
    diplomas,
  } = req.body;

  if (email) {
    const emailCheck = await query('SELECT id FROM employees WHERE email = $1', [email]);
    if (emailCheck.rows[0]) return res.status(409).json({ error: 'Email déjà utilisé' });
  }
  const matriculeCheck = await query('SELECT id FROM employees WHERE matricule = $1', [matricule]);
  if (matriculeCheck.rows[0]) return res.status(409).json({ error: 'Matricule déjà utilisé' });

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
      `INSERT INTO employees (
         matricule, first_name, last_name, gender, email, phone, birth_date,
         function, service_line, grade, contract_type, entry_date, exit_date,
         salary, notes, has_dec_french, has_decofi, has_other_dec, has_cisa, has_cfa,
         department, is_expatriate, manager_id, marital_status, spouse_name, spouse_phone,
         children_count, created_by
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)
       RETURNING *`,
      [
        matricule, first_name, last_name, gender, email || null, phone || null, birth_date,
        fn, service_line, grade, contract_type, entry_date, exit_date || null,
        salary || null, notes || null,
        has_dec_french || false, has_decofi || false, has_other_dec || false,
        has_cisa || false, has_cfa || false, department || null,
        is_expatriate || false, manager_id || null,
        marital_status || 'CELIBATAIRE', spouse_name || null, spouse_phone || null,
        children_count || 0, req.user?.userId,
      ]
    );

    // Historique salaire initial
    if (salary) {
      await query(
        `INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes, created_by)
         VALUES ($1, NULL, $2, $3, 'Salaire initial', $4)`,
        [result.rows[0].id, salary, entry_date, req.user?.userId]
      );
    }

    // Insérer les diplômes si fournis
    if (diplomas && Array.isArray(diplomas)) {
      for (const d of diplomas) {
        if (d.diploma_type) {
          await query(
            `INSERT INTO employee_diplomas (employee_id, diploma_type, domaine, created_by) VALUES ($1, $2, $3, $4)`,
            [result.rows[0].id, d.diploma_type, d.domaine || null, req.user?.userId]
          );
        }
      }
    }

    logger.info(`Nouveau collaborateur créé: ${matricule} par ${req.user?.email}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('createEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// METTRE À JOUR UN COLLABORATEUR
// ============================================================

export const updateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = { ...req.body };

  // Extraire les diplômes avant de construire la requête SQL
  const diplomasToUpdate = updates.diplomas;

  // Supprimer les champs calculés / non-colonnes
  for (const f of ['id', 'created_at', 'updated_at', 'created_by', 'status',
                    'age', 'season', 'seniority', 'manager_name', 'diplomas']) {
    delete updates[f];
  }

  // Gérer le changement de salaire → historique
  const salaryChanged = 'salary' in updates;
  let oldSalary: number | null = null;

  if (salaryChanged) {
    try {
      const cur = await query('SELECT salary FROM employees WHERE id = $1', [id]);
      oldSalary = cur.rows[0]?.salary ?? null;
    } catch {}
  }

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

    // Enregistrer historique salaire si changement
    if (salaryChanged && updates.salary !== oldSalary) {
      await query(
        `INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, created_by)
         VALUES ($1, $2, $3, CURRENT_DATE, $4)`,
        [id, oldSalary, updates.salary, req.user?.userId]
      );
    }

    // Mettre à jour les diplômes si fournis (DRH et Direction Générale uniquement)
    if (diplomasToUpdate !== undefined && ['DRH', 'DIRECTION_GENERALE'].includes(req.user?.role || '')) {
      await query(`DELETE FROM employee_diplomas WHERE employee_id = $1`, [id]);
      if (Array.isArray(diplomasToUpdate)) {
        for (const d of diplomasToUpdate) {
          if (d.diploma_type) {
            await query(
              `INSERT INTO employee_diplomas (employee_id, diploma_type, domaine, created_by) VALUES ($1, $2, $3, $4)`,
              [id, d.diploma_type, d.domaine || null, req.user?.userId]
            );
          }
        }
      }
    }

    logger.info(`Collaborateur modifié: ${id} par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    logger.error('updateEmployee error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// DÉSACTIVER UN COLLABORATEUR
// ============================================================

export const deactivateEmployee = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { exit_date } = req.body;

  try {
    const result = await query(
      `UPDATE employees SET exit_date = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [exit_date || new Date().toISOString().split('T')[0], id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Collaborateur non trouvé' });

    logger.info(`Collaborateur désactivé: ${id} par ${req.user?.email}`);
    return res.json(result.rows[0]);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// HISTORIQUE DES MODIFICATIONS
// ============================================================

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

// ============================================================
// HISTORIQUE DES SALAIRES
// ============================================================

export const getSalaryHistory = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!canViewSalary(req.user?.role)) {
    return res.status(403).json({ error: 'Accès non autorisé' });
  }
  try {
    const result = await query(
      `SELECT sh.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM salary_history sh
       LEFT JOIN users u ON u.id = sh.created_by
       WHERE sh.employee_id = $1
       ORDER BY sh.effective_date DESC`,
      [id]
    );
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

// ============================================================
// VÉRIFIER DOUBLONS
// ============================================================

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

// ============================================================
// PHOTO DE PROFIL
// ============================================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'photos');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
  },
});

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Utilisez JPEG, PNG ou WebP.'));
    }
  },
}).single('photo');

export const handlePhotoUpload = async (req: Request, res: Response) => {
  const { id } = req.params;
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier fourni' });

  try {
    // Supprimer l'ancienne photo
    const old = await query('SELECT photo_url FROM employees WHERE id = $1', [id]);
    if (old.rows[0]?.photo_url) {
      const oldPath = path.join(process.cwd(), 'uploads', 'photos', path.basename(old.rows[0].photo_url));
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const photoUrl = `/api/employees/${id}/photo/file/${req.file.filename}`;
    await query('UPDATE employees SET photo_url = $1, updated_at = NOW() WHERE id = $2', [photoUrl, id]);

    return res.json({ photo_url: photoUrl });
  } catch (err) {
    logger.error('handlePhotoUpload error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const servePhoto = async (req: Request, res: Response) => {
  const { filename } = req.params;
  const filePath = path.join(process.cwd(), 'uploads', 'photos', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Photo non trouvée' });
  }
  return res.sendFile(filePath);
};

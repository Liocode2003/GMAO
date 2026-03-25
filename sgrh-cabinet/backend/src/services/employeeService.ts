import { query } from '../config/database';
import { UserRole } from '../types';

const SALARY_ROLES: UserRole[] = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE'];

export const canViewSalary = (role?: UserRole) => role != null && SALARY_ROLES.includes(role);
export const canViewBirthDate = (role?: UserRole) =>
  role != null && (['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER'] as UserRole[]).includes(role);

export const sanitizeEmployee = (emp: Record<string, unknown>, role?: UserRole) => {
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

export const calcSeniority = (entryDate: Date) => {
  const now = new Date();
  const diff = now.getTime() - new Date(entryDate).getTime();
  const years = Math.floor(diff / (365.25 * 24 * 3600 * 1000));
  const months = Math.floor((diff % (365.25 * 24 * 3600 * 1000)) / (30.44 * 24 * 3600 * 1000));
  return { years, months, label: `${years} an(s) ${months} mois` };
};

export const employeeService = {
  async findById(id: string) {
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
    return result.rows[0] || null;
  },

  async findDiplomas(employeeId: string) {
    const result = await query(
      `SELECT id, diploma_type, diploma_other, domaine, domaine_other
       FROM employee_diplomas WHERE employee_id = $1 ORDER BY created_at`,
      [employeeId]
    );
    return result.rows;
  },

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    const params: unknown[] = [email];
    const condition = excludeId ? ' AND id != $2' : '';
    if (excludeId) params.push(excludeId);
    const result = await query(`SELECT id FROM employees WHERE email = $1${condition}`, params);
    return !!result.rows[0];
  },

  async checkMatriculeExists(matricule: string, excludeId?: string): Promise<boolean> {
    const params: unknown[] = [matricule];
    const condition = excludeId ? ' AND id != $2' : '';
    if (excludeId) params.push(excludeId);
    const result = await query(`SELECT id FROM employees WHERE matricule = $1${condition}`, params);
    return !!result.rows[0];
  },

  async checkDuplicate(firstName: string, lastName: string, birthDate: string, excludeId?: string) {
    // Normalise : retire les accents, espaces multiples, met en minuscule
    const normalize = (s: string) =>
      s.trim().toLowerCase()
        .normalize('NFD').replace(/\p{Diacritic}/gu, '')
        .replace(/\s+/g, ' ');

    const normFirst = normalize(firstName);
    const normLast  = normalize(lastName);

    const excludeCond = excludeId ? ` AND id != $${4}` : '';
    const params: unknown[] = [normFirst, normLast, birthDate];
    if (excludeId) params.push(excludeId);

    // Cherche via comparaison normalisée côté SQL
    const result = await query(
      `SELECT id, first_name, last_name FROM employees
       WHERE LOWER(REGEXP_REPLACE(first_name, '[^a-zA-Z0-9 ]', '', 'g')) = $1
         AND LOWER(REGEXP_REPLACE(last_name,  '[^a-zA-Z0-9 ]', '', 'g')) = $2
         AND birth_date = $3
         ${excludeCond}`,
      params
    );
    return result.rows[0] || null;
  },

  async recordSalaryHistory(
    employeeId: string,
    oldSalary: number | null,
    newSalary: number,
    effectiveDate: string,
    createdBy: string,
    notes?: string
  ) {
    await query(
      `INSERT INTO salary_history (employee_id, old_salary, new_salary, effective_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [employeeId, oldSalary, newSalary, effectiveDate, notes || null, createdBy]
    );
  },

  async recordAuditLog(
    userId: string,
    userEmail: string,
    action: string,
    resourceType: string,
    resourceId: string,
    fieldAccessed: string,
    ipAddress?: string
  ) {
    await query(
      `INSERT INTO audit_logs(user_id, user_email, action, resource_type, resource_id, field_accessed, ip_address)
       VALUES($1,$2,$3,$4,$5,$6,$7)`,
      [userId, userEmail, action, resourceType, resourceId, fieldAccessed, ipAddress]
    );
  },

  async getSalaryHistory(employeeId: string) {
    const result = await query(
      `SELECT sh.*, u.first_name || ' ' || u.last_name as created_by_name
       FROM salary_history sh
       LEFT JOIN users u ON u.id = sh.created_by
       WHERE sh.employee_id = $1
       ORDER BY sh.effective_date DESC`,
      [employeeId]
    );
    return result.rows;
  },

  async deactivate(employeeId: string, exitDate: string) {
    const result = await query(
      `UPDATE employees SET exit_date = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [exitDate, employeeId]
    );
    return result.rows[0] || null;
  },
};

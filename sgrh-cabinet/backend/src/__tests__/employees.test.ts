import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';

jest.mock('../config/database');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../jobs/scheduler', () => ({ initScheduler: jest.fn() }));

import app from '../app';
import { query } from '../config/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

const makeResult = (rows: Record<string, unknown>[]) =>
  ({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] } as ReturnType<typeof query> extends Promise<infer R> ? R : never);

const makeToken = (role = 'DRH') =>
  jwt.sign({ userId: 'user-1', email: 'drh@test.ci', role }, 'test_secret_key_for_jest', { expiresIn: '1h' });

const fakeEmployee = {
  id: 'emp-uuid-1',
  matricule: 'EMP001',
  first_name: 'Jean',
  last_name: 'Dupont',
  gender: 'M',
  email: 'jean.dupont@cabinet.ci',
  birth_date: '1990-01-15',
  function: 'AUDITEUR',
  service_line: 'AUDIT_ASSURANCE',
  grade: 'SENIOR_2',
  contract_type: 'CDI',
  entry_date: '2020-03-01',
  salary: 500000,
  exit_date: null,
};

describe('GET /api/employees', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
  });

  it('retourne la liste paginée des employés', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ count: '5' }]))
      .mockResolvedValueOnce(makeResult([fakeEmployee]));

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('pagination');
    expect(res.body.pagination.total).toBe(5);
  });

  it('filtre par service_line', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ count: '1' }]))
      .mockResolvedValueOnce(makeResult([fakeEmployee]));

    const res = await request(app)
      .get('/api/employees?service_line=AUDIT_ASSURANCE')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('service_line'),
      expect.arrayContaining(['AUDIT_ASSURANCE'])
    );
  });

  it('masque le salaire pour le rôle UTILISATEUR', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ count: '1' }]))
      .mockResolvedValueOnce(makeResult([fakeEmployee]));

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).not.toHaveProperty('salary');
  });

  it('retourne le salaire pour le rôle DRH', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ count: '1' }]))
      .mockResolvedValueOnce(makeResult([{ ...fakeEmployee, seniority: null }]));

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);

    expect(res.status).toBe(200);
    expect(res.body.data[0]).toHaveProperty('salary');
  });
});

describe('GET /api/employees/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 404 si collaborateur inexistant', async () => {
    // auditLog calls next() first → findById query runs before auditLog INSERT
    mockQuery
      .mockResolvedValueOnce(makeResult([]))    // 1st: SELECT employee → vide → 404
      .mockResolvedValueOnce(makeResult([{}])); // 2nd: auditLog INSERT (runs after next())

    const res = await request(app)
      .get('/api/employees/non-existent-id')
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/non trouvé/i);
  });

  it('retourne les détails du collaborateur', async () => {
    // Ordre réel: 1) SELECT employee (findById), 2) auditLog INSERT, 3) SELECT diplomas, 4) audit salary INSERT
    mockQuery
      .mockResolvedValueOnce(makeResult([fakeEmployee]))   // 1st: SELECT employee
      .mockResolvedValueOnce(makeResult([{}]))             // 2nd: auditLog INSERT
      .mockResolvedValueOnce(makeResult([]))               // 3rd: SELECT diplomas
      .mockResolvedValueOnce(makeResult([{}]));            // 4th: audit_log salary (DRH)

    const res = await request(app)
      .get(`/api/employees/${fakeEmployee.id}`)
      .set('Authorization', `Bearer ${makeToken()}`);

    expect(res.status).toBe(200);
    expect(res.body.matricule).toBe(fakeEmployee.matricule);
    expect(res.body).toHaveProperty('seniority');
    expect(res.body).toHaveProperty('diplomas');
  });

  it('crée un audit_log lors de la consultation du salaire par un DRH', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([fakeEmployee]))   // 1st: SELECT employee
      .mockResolvedValueOnce(makeResult([{}]))             // 2nd: auditLog INSERT
      .mockResolvedValueOnce(makeResult([]))               // 3rd: diplomas
      .mockResolvedValueOnce(makeResult([{}]));            // 4th: audit salary

    await request(app)
      .get(`/api/employees/${fakeEmployee.id}`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`);

    const auditCall = mockQuery.mock.calls.find(([sql]) =>
      typeof sql === 'string' && sql.includes('audit_logs')
    );
    expect(auditCall).toBeDefined();
  });
});

describe('POST /api/employees', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour un UTILISATEUR', async () => {
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`)
      .send({ matricule: 'EMP999' });
    expect(res.status).toBe(403);
  });

  it('retourne 409 si matricule déjà utilisé', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([]))                    // email check
      .mockResolvedValueOnce(makeResult([{ id: 'existing' }])) // matricule check
    ;
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ ...fakeEmployee });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/matricule/i);
  });

  it('retourne 409 si email déjà utilisé', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'existing' }])); // email check
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ ...fakeEmployee });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/email/i);
  });

  it('crée un collaborateur avec succès', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([]))                  // email check
      .mockResolvedValueOnce(makeResult([]))                  // matricule check
      .mockResolvedValueOnce(makeResult([]))                  // doublon check
      .mockResolvedValueOnce(makeResult([fakeEmployee]))      // INSERT employee
      .mockResolvedValueOnce(makeResult([{}]));               // INSERT salary_history

    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ ...fakeEmployee, birth_date: '1990-01-15', entry_date: '2020-03-01' });

    expect(res.status).toBe(201);
    expect(res.body.matricule).toBe(fakeEmployee.matricule);
  });
});

describe('PATCH /api/employees/:id/deactivate', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour un MANAGER', async () => {
    const res = await request(app)
      .patch(`/api/employees/${fakeEmployee.id}/deactivate`)
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ exit_date: '2024-01-01' });
    expect(res.status).toBe(403);
  });

  it('désactive un collaborateur avec succès', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeEmployee, exit_date: '2024-01-01' }]));
    const res = await request(app)
      .patch(`/api/employees/${fakeEmployee.id}/deactivate`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ exit_date: '2024-01-01' });
    expect(res.status).toBe(200);
  });

  it('retourne 404 si collaborateur inexistant', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .patch('/api/employees/not-found/deactivate')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ exit_date: '2024-01-01' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/employees/:id/salary-history', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour un MANAGER', async () => {
    const res = await request(app)
      .get(`/api/employees/${fakeEmployee.id}/salary-history`)
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne l\'historique pour un DRH', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([
      { id: 'sh-1', old_salary: 400000, new_salary: 500000, effective_date: '2023-01-01' },
    ]));
    const res = await request(app)
      .get(`/api/employees/${fakeEmployee.id}/salary-history`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/employees/check-duplicates', () => {
  beforeEach(() => mockQuery.mockReset());

  it('détecte un doublon sur le matricule', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'emp-existing', first_name: 'Existing', last_name: 'User' }]));
    const res = await request(app)
      .get('/api/employees/check-duplicates?matricule=EMP001')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(res.body.hasDuplicates).toBe(true);
    expect(res.body.duplicates).toHaveProperty('matricule');
  });

  it('retourne hasDuplicates=false si aucun doublon', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .get('/api/employees/check-duplicates?matricule=EMP999')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(res.body.hasDuplicates).toBe(false);
  });
});

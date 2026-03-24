import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';

jest.mock('../config/database');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../jobs/scheduler', () => ({ initScheduler: jest.fn() }));
jest.mock('../services/emailService', () => ({
  sendUnplannedLeaveAlert: jest.fn().mockResolvedValue(undefined),
  sendLeaveBalanceAlert: jest.fn().mockResolvedValue(undefined),
}));

import app from '../app';
import { query, getClient } from '../config/database';

const mockQuery = query as jest.MockedFunction<typeof query>;
const mockGetClient = getClient as jest.MockedFunction<typeof getClient>;

const makeResult = (rows: Record<string, unknown>[]) =>
  ({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] } as ReturnType<typeof query> extends Promise<infer R> ? R : never);

const makeToken = (role = 'DRH') =>
  jwt.sign({ userId: 'user-1', email: 'drh@test.ci', role }, 'test_secret_key_for_jest', { expiresIn: '1h' });

const fakeEmployee = {
  id: 'emp-1',
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean@cabinet.ci',
  status: 'ACTIF',
  entry_date: '2020-01-01',
};

const fakeBalance = {
  employee_id: 'emp-1',
  year: 2026,
  annual_allowance: 30,
  carry_over: 0,
  days_taken: 5,
  days_unpaid: 0,
  balance: '25',
  first_name: 'Jean',
  last_name: 'Dupont',
  entry_date: '2020-01-01',
  days_unplanned: '0',
};

const fakeLeave = {
  id: 'leave-1',
  employee_id: 'emp-1',
  type: 'PLANIFIE',
  start_date: '2026-04-01',
  end_date: '2026-04-05',
  days: 5,
  year: 2026,
  status: 'EN_ATTENTE',
};

// Helper pour créer un mock client de transaction
function makeMockClient(queryResponses: ReturnType<typeof makeResult>[]) {
  let call = 0;
  const mockClient = {
    query: jest.fn().mockImplementation(() => {
      const response = queryResponses[call] ?? makeResult([{}]);
      call++;
      return Promise.resolve(response);
    }),
    release: jest.fn(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockGetClient.mockResolvedValue(mockClient as any);
  return mockClient;
}

// ============================================================
// GET /api/leaves/employee/:id/balance
// ============================================================

describe('GET /api/leaves/employee/:id/balance', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/leaves/employee/emp-1/balance');
    expect(res.status).toBe(401);
  });

  it('retourne le solde de congés', async () => {
    // ensureBalance: SELECT entry_date, then INSERT ON CONFLICT DO NOTHING
    // getLeaveBalance: SELECT balance join employee
    mockQuery
      .mockResolvedValueOnce(makeResult([{ entry_date: '2020-01-01' }])) // ensureBalance SELECT entry_date
      .mockResolvedValueOnce(makeResult([{}]))                            // ensureBalance INSERT
      .mockResolvedValueOnce(makeResult([fakeBalance]));                  // SELECT balance

    const res = await request(app)
      .get('/api/leaves/employee/emp-1/balance')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.employee_id).toBe('emp-1');
    expect(res.body.balance).toBe('25');
  });

  it('retourne null si aucun solde trouvé', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ entry_date: '2020-01-01' }]))
      .mockResolvedValueOnce(makeResult([{}]))
      .mockResolvedValueOnce(makeResult([]));

    const res = await request(app)
      .get('/api/leaves/employee/emp-1/balance')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeNull();
  });
});

// ============================================================
// GET /api/leaves/employee/:id
// ============================================================

describe('GET /api/leaves/employee/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/leaves/employee/emp-1');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des congés', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeLeave]));
    const res = await request(app)
      .get('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('leave-1');
  });

  it('accepte un filtre par année', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeLeave]));
    const res = await request(app)
      .get('/api/leaves/employee/emp-1?year=2026')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('AND l.year'),
      expect.arrayContaining(['emp-1', 2026])
    );
  });
});

// ============================================================
// POST /api/leaves/employee/:id  (createLeave)
// ============================================================

describe('POST /api/leaves/employee/:id', () => {
  beforeEach(() => {
    mockQuery.mockReset();
    mockGetClient.mockReset();
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .send({ type: 'PLANIFIE', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle insuffisant', async () => {
    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken('EMPLOYE')}`)
      .send({ type: 'PLANIFIE', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(403);
  });

  it('retourne 400 si champs manquants', async () => {
    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(400);
  });

  it('retourne 400 si type invalide', async () => {
    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ type: 'MAUVAIS', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(400);
  });

  it('retourne 404 si employé introuvable', async () => {
    // empRes returns empty
    mockQuery.mockResolvedValueOnce(makeResult([]));

    const mockClient = makeMockClient([]);
    mockClient; // unused but needed for setup

    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ type: 'PLANIFIE', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(404);
  });

  it('retourne 400 si solde insuffisant pour PLANIFIE', async () => {
    // 1. SELECT employee
    mockQuery.mockResolvedValueOnce(makeResult([fakeEmployee]));

    // Transaction client: BEGIN, ensureBalance (SELECT entry_date + INSERT), SELECT balance FOR UPDATE
    makeMockClient([
      makeResult([{}]),                        // BEGIN
      makeResult([{ entry_date: '2020-01-01' }]), // ensureBalance SELECT entry_date - NOT called via client
      makeResult([{}]),                        // SELECT balance FOR UPDATE → balance = 0
    ]);

    // ensureBalance uses global query
    mockQuery
      .mockResolvedValueOnce(makeResult([{ entry_date: '2020-01-01' }])) // ensureBalance SELECT
      .mockResolvedValueOnce(makeResult([{}]));                          // ensureBalance INSERT

    // The transaction client query calls: BEGIN, SELECT balance FOR UPDATE
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce(makeResult([{}]))                    // BEGIN
        .mockResolvedValueOnce(makeResult([{ balance: '0' }]))     // SELECT balance FOR UPDATE
        .mockResolvedValueOnce(makeResult([{}])),                   // ROLLBACK
      release: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetClient.mockResolvedValue(mockClient as any);

    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ type: 'PLANIFIE', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/solde insuffisant/i);
  });

  it('crée un congé planifié avec solde suffisant', async () => {
    // SELECT employee
    mockQuery.mockResolvedValueOnce(makeResult([fakeEmployee]));
    // ensureBalance (global query)
    mockQuery
      .mockResolvedValueOnce(makeResult([{ entry_date: '2020-01-01' }])) // SELECT entry_date
      .mockResolvedValueOnce(makeResult([{}]));                          // INSERT ON CONFLICT

    const newLeave = { ...fakeLeave, id: 'leave-new' };
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce(makeResult([{}]))                    // BEGIN
        .mockResolvedValueOnce(makeResult([{ balance: '25' }]))    // SELECT balance FOR UPDATE
        .mockResolvedValueOnce(makeResult([newLeave]))             // INSERT INTO leaves
        .mockResolvedValueOnce(makeResult([{}])),                   // COMMIT
      release: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetClient.mockResolvedValue(mockClient as any);

    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ type: 'PLANIFIE', start_date: '2026-04-01', end_date: '2026-04-05' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('leave-new');
  });

  it('crée un congé imprévu et met à jour le solde', async () => {
    // SELECT employee
    mockQuery.mockResolvedValueOnce(makeResult([fakeEmployee]));
    // ensureBalance (global query)
    mockQuery
      .mockResolvedValueOnce(makeResult([{ entry_date: '2020-01-01' }]))
      .mockResolvedValueOnce(makeResult([{}]));

    const unplannedLeave = { ...fakeLeave, id: 'leave-imp', type: 'IMPRÉVU', status: 'APPROUVE' };
    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce(makeResult([{}]))                          // BEGIN
        .mockResolvedValueOnce(makeResult([unplannedLeave]))              // INSERT INTO leaves
        .mockResolvedValueOnce(makeResult([{ balance: '20' }]))          // SELECT balance FOR UPDATE (imprévu)
        .mockResolvedValueOnce(makeResult([{}]))                          // UPDATE leave_balances
        .mockResolvedValueOnce(makeResult([{}])),                         // COMMIT
      release: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockGetClient.mockResolvedValue(mockClient as any);

    const res = await request(app)
      .post('/api/leaves/employee/emp-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ type: 'IMPRÉVU', absence_subtype: 'MALADIE', start_date: '2026-04-01', end_date: '2026-04-02' });
    expect(res.status).toBe(201);
  });
});

// ============================================================
// PATCH /api/leaves/:leaveId/approve
// ============================================================

describe('PATCH /api/leaves/:leaveId/approve', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).patch('/api/leaves/leave-1/approve').send({ status: 'APPROUVE' });
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle insuffisant (MANAGER)', async () => {
    const res = await request(app)
      .patch('/api/leaves/leave-1/approve')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ status: 'APPROUVE' });
    expect(res.status).toBe(403);
  });

  it('retourne 404 si congé introuvable', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .patch('/api/leaves/leave-1/approve')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'APPROUVE' });
    expect(res.status).toBe(404);
  });

  it('retourne 400 si le congé n\'est pas EN_ATTENTE', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeLeave, status: 'APPROUVE' }]));
    const res = await request(app)
      .patch('/api/leaves/leave-1/approve')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'APPROUVE' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/déjà été traité/i);
  });

  it('approuve un congé en attente', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([fakeLeave]))   // SELECT leave
      .mockResolvedValueOnce(makeResult([{}]))           // UPDATE leaves SET status
      .mockResolvedValueOnce(makeResult([{ total: 5 }])) // recalcBalance SELECT SUM
      .mockResolvedValueOnce(makeResult([{}]));          // recalcBalance UPDATE

    const res = await request(app)
      .patch('/api/leaves/leave-1/approve')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'APPROUVE' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/approuvé/i);
  });

  it('refuse un congé en attente', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([fakeLeave]))
      .mockResolvedValueOnce(makeResult([{}]));

    const res = await request(app)
      .patch('/api/leaves/leave-1/approve')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({ status: 'REFUSE', notes: 'Période chargée' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/refusé/i);
  });
});

// ============================================================
// DELETE /api/leaves/:leaveId
// ============================================================

describe('DELETE /api/leaves/:leaveId', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/leaves/leave-1');
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle MANAGER', async () => {
    const res = await request(app)
      .delete('/api/leaves/leave-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si congé introuvable', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .delete('/api/leaves/leave-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it('supprime un congé en attente', async () => {
    const pendingLeave = { ...fakeLeave, status: 'EN_ATTENTE', type: 'PLANIFIE' };
    mockQuery
      .mockResolvedValueOnce(makeResult([pendingLeave]))
      .mockResolvedValueOnce(makeResult([{}])); // DELETE

    const res = await request(app)
      .delete('/api/leaves/leave-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimé/i);
  });

  it('supprime un congé planifié approuvé et recalcule le solde', async () => {
    const approvedLeave = { ...fakeLeave, status: 'APPROUVE', type: 'PLANIFIE' };
    mockQuery
      .mockResolvedValueOnce(makeResult([approvedLeave]))
      .mockResolvedValueOnce(makeResult([{}]))            // DELETE
      .mockResolvedValueOnce(makeResult([{ total: 0 }])) // recalcBalance SELECT SUM
      .mockResolvedValueOnce(makeResult([{}]));           // recalcBalance UPDATE

    const res = await request(app)
      .delete('/api/leaves/leave-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  it('supprime un congé imprévu approuvé et soustrait du solde', async () => {
    const unplannedApproved = { ...fakeLeave, status: 'APPROUVE', type: 'IMPRÉVU', days: 2, employee_id: 'emp-1', year: 2026 };
    mockQuery
      .mockResolvedValueOnce(makeResult([unplannedApproved]))
      .mockResolvedValueOnce(makeResult([{}]))   // DELETE
      .mockResolvedValueOnce(makeResult([{}]));  // UPDATE leave_balances

    const res = await request(app)
      .delete('/api/leaves/leave-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });
});

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

const fakeEvaluation = {
  id: 'eval-uuid-1',
  employee_id: 'emp-uuid-1',
  evaluator_id: 'user-1',
  year: 2025,
  period: 'ANNUEL',
  status: 'BROUILLON',
  overall_score: 15.33,
  objectives_score: 16,
  skills_score: 15,
  behavior_score: 15,
  comments: 'Bon travail',
  objectives: 'Améliorer la productivité',
  strengths: 'Rigueur',
  improvements: 'Communication',
  employee_name: 'Jean Dupont',
  employee_function: 'AUDITEUR',
  employee_service_line: 'AUDIT_ASSURANCE',
  evaluator_name: 'Alice DRH',
  created_at: '2025-12-01T10:00:00Z',
};

describe('GET /api/evaluations', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/evaluations');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des évaluations', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeEvaluation]));
    const res = await request(app)
      .get('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].employee_name).toBe('Jean Dupont');
  });

  it('filtre par année', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeEvaluation]));
    const res = await request(app)
      .get('/api/evaluations?year=2025')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ev.year'),
      expect.arrayContaining([expect.anything()])
    );
  });

  it('filtre par statut', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .get('/api/evaluations?status=TERMINE')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ev.status'),
      expect.arrayContaining(['TERMINE'])
    );
  });
});

describe('GET /api/evaluations/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 404 si évaluation inconnue', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .get('/api/evaluations/unknown-id')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it('retourne l\'évaluation par id', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeEvaluation]));
    const res = await request(app)
      .get('/api/evaluations/eval-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('eval-uuid-1');
  });
});

describe('POST /api/evaluations', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour le rôle UTILISATEUR', async () => {
    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`)
      .send({ employee_id: 'emp-1', year: 2025 });
    expect(res.status).toBe(403);
  });

  it('retourne 400 si employee_id ou year manquant', async () => {
    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ year: 2025 });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/employee_id/);
  });

  it('crée une évaluation avec note globale calculée', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeEvaluation, overall_score: 15.33 }]));
    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({
        employee_id: 'emp-uuid-1',
        year: 2025,
        period: 'ANNUEL',
        status: 'BROUILLON',
        objectives_score: 16,
        skills_score: 15,
        behavior_score: 15,
      });
    expect(res.status).toBe(201);
    expect(res.body.overall_score).toBeCloseTo(15.33, 1);
  });

  it('retourne 409 si doublon employé/année/période', async () => {
    const pgErr = Object.assign(new Error('unique violation'), { code: '23505' });
    mockQuery.mockRejectedValueOnce(pgErr);
    const res = await request(app)
      .post('/api/evaluations')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ employee_id: 'emp-uuid-1', year: 2025, period: 'ANNUEL' });
    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/existe déjà/);
  });
});

describe('PUT /api/evaluations/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 404 si évaluation inconnue', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .put('/api/evaluations/unknown')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ status: 'TERMINE' });
    expect(res.status).toBe(404);
  });

  it('met à jour le statut', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeEvaluation, status: 'TERMINE' }]));
    const res = await request(app)
      .put('/api/evaluations/eval-uuid-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ status: 'TERMINE' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TERMINE');
  });
});

describe('DELETE /api/evaluations/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour le rôle MANAGER', async () => {
    const res = await request(app)
      .delete('/api/evaluations/eval-uuid-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si évaluation inconnue', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .delete('/api/evaluations/unknown')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(404);
  });

  it('supprime l\'évaluation', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'eval-uuid-1' }]));
    const res = await request(app)
      .delete('/api/evaluations/eval-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimée/i);
  });
});

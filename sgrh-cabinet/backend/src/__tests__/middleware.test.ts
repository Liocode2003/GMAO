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

describe('Middleware authenticate', () => {
  it('retourne 401 si aucun header Authorization', async () => {
    const res = await request(app).get('/api/employees');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/token manquant/i);
  });

  it('retourne 401 si token mal formaté (pas Bearer)', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', 'Basic sometoken');
    expect(res.status).toBe(401);
  });

  it('retourne 401 si token JWT invalide', async () => {
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', 'Bearer token_invalide');
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalide|expiré/i);
  });

  it('retourne 401 si token JWT signé avec mauvais secret', async () => {
    const badToken = jwt.sign({ userId: 'x', email: 'x@x.com', role: 'DRH' }, 'mauvais_secret');
    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${badToken}`);
    expect(res.status).toBe(401);
  });

  it('laisse passer avec un token valide', async () => {
    const token = jwt.sign(
      { userId: 'user-1', email: 'drh@test.ci', role: 'DRH' },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    mockQuery
      .mockResolvedValueOnce(makeResult([{ count: '0' }]))
      .mockResolvedValueOnce(makeResult([]));

    const res = await request(app)
      .get('/api/employees')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('Middleware authorize (RBAC)', () => {
  const roles = ['DRH', 'DIRECTION_GENERALE', 'ASSOCIE', 'MANAGER', 'UTILISATEUR'] as const;

  it('UTILISATEUR ne peut pas accéder à /api/users (réservé DRH/Direction)', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'user@test.ci', role: 'UTILISATEUR' },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/non autorisé/i);
  });

  it('MANAGER ne peut pas créer un employé', async () => {
    // Note: MANAGER peut modifier mais pas créer (selon les routes)
    const token = jwt.sign(
      { userId: 'u1', email: 'mgr@test.ci', role: 'MANAGER' },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/api/employees')
      .set('Authorization', `Bearer ${token}`)
      .send({ matricule: 'TEST001' });
    expect(res.status).toBe(403);
  });

  it('ASSOCIE ne peut pas générer un rapport (POST /reports/generate réservé DRH/Direction)', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'assoc@test.ci', role: 'ASSOCIE' },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .post('/api/reports/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ year: 2024, month: 6 });
    expect(res.status).toBe(403);
  });
});

describe('Route 404', () => {
  it('retourne 404 pour une route inexistante', async () => {
    const token = jwt.sign(
      { userId: 'u1', email: 'drh@test.ci', role: 'DRH' },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    const res = await request(app)
      .get('/api/route-qui-nexiste-pas')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

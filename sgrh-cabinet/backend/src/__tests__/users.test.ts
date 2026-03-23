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

const fakeUser = {
  id: 'user-uuid-2',
  email: 'manager@cabinet.ci',
  first_name: 'Bob',
  last_name: 'Martin',
  role: 'MANAGER',
  is_active: true,
  created_at: new Date().toISOString(),
};

describe('GET /api/users', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour un MANAGER', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne la liste des utilisateurs pour un DRH', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeUser]));
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].email).toBe(fakeUser.email);
    expect(res.body[0]).not.toHaveProperty('password_hash');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 400 si champs manquants', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ email: 'test@test.ci' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requis/i);
  });

  it('retourne 409 si email déjà utilisé', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'existing' }]));
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ email: 'manager@cabinet.ci', password: 'Pass123!', first_name: 'Bob', last_name: 'Martin', role: 'MANAGER' });
    expect(res.status).toBe(409);
  });

  it('crée un utilisateur avec succès', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([]))            // check email
      .mockResolvedValueOnce(makeResult([fakeUser]));   // INSERT

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ email: 'newuser@cabinet.ci', password: 'Pass123!', first_name: 'New', last_name: 'User', role: 'UTILISATEUR' });
    expect(res.status).toBe(201);
    expect(res.body).not.toHaveProperty('password_hash');
  });
});

describe('PUT /api/users/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 404 si utilisateur inexistant', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .put('/api/users/unknown-id')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ role: 'ASSOCIE' });
    expect(res.status).toBe(404);
  });

  it('met à jour le rôle de l\'utilisateur', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeUser, role: 'ASSOCIE' }]));
    const res = await request(app)
      .put(`/api/users/${fakeUser.id}`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ role: 'ASSOCIE' });
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('ASSOCIE');
  });
});

describe('POST /api/users/:id/reset-password', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 400 si nouveau mot de passe trop court', async () => {
    const res = await request(app)
      .post(`/api/users/${fakeUser.id}/reset-password`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ newPassword: 'court' });
    expect(res.status).toBe(400);
  });

  it('réinitialise le mot de passe avec succès', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{}]));
    const res = await request(app)
      .post(`/api/users/${fakeUser.id}/reset-password`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ newPassword: 'NouveauMdp123!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/réinitialisé/i);
  });
});

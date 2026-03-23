import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Setup avant l'import de l'app
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

const makeQueryResult = (rows: Record<string, unknown>[]) =>
  ({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] } as ReturnType<typeof query> extends Promise<infer R> ? R : never);

const fakeUser = {
  id: 'user-uuid-123',
  email: 'drh@cabinet.ci',
  password_hash: bcrypt.hashSync('Admin123!', 10),
  first_name: 'Alice',
  last_name: 'Dupont',
  role: 'DRH',
  is_active: true,
};

describe('POST /api/auth/login', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 400 si email ou mot de passe manquant', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: '' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/requis/i);
  });

  it('retourne 401 si utilisateur introuvable', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([]));
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com', password: 'pass' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/identifiants/i);
  });

  it('retourne 401 si mot de passe incorrect', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([fakeUser]));
    const res = await request(app).post('/api/auth/login').send({ email: fakeUser.email, password: 'MauvaisPass' });
    expect(res.status).toBe(401);
  });

  it('retourne 401 si utilisateur inactif', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([{ ...fakeUser, is_active: false }]));
    const res = await request(app).post('/api/auth/login').send({ email: fakeUser.email, password: 'Admin123!' });
    expect(res.status).toBe(401);
  });

  it('retourne accessToken et refreshToken si login correct', async () => {
    mockQuery
      .mockResolvedValueOnce(makeQueryResult([fakeUser])) // SELECT user
      .mockResolvedValueOnce(makeQueryResult([{ id: 'rt-1' }])) // INSERT refresh_token
      .mockResolvedValueOnce(makeQueryResult([{ id: fakeUser.id }])); // UPDATE last_login

    const res = await request(app).post('/api/auth/login').send({ email: fakeUser.email, password: 'Admin123!' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.role).toBe('DRH');
    expect(res.body.user).not.toHaveProperty('password_hash');
  });

  it('le token JWT contient les bonnes propriétés', async () => {
    mockQuery
      .mockResolvedValueOnce(makeQueryResult([fakeUser]))
      .mockResolvedValueOnce(makeQueryResult([{ id: 'rt-1' }]))
      .mockResolvedValueOnce(makeQueryResult([{}]));

    const res = await request(app).post('/api/auth/login').send({ email: fakeUser.email, password: 'Admin123!' });
    const decoded = jwt.verify(res.body.accessToken, 'test_secret_key_for_jest') as Record<string, unknown>;
    expect(decoded.userId).toBe(fakeUser.id);
    expect(decoded.email).toBe(fakeUser.email);
    expect(decoded.role).toBe('DRH');
  });
});

describe('POST /api/auth/refresh', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 400 si token manquant', async () => {
    const res = await request(app).post('/api/auth/refresh').send({});
    expect(res.status).toBe(400);
  });

  it('retourne 401 si token invalide ou expiré', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([]));
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'invalid-token' });
    expect(res.status).toBe(401);
  });

  it('retourne un nouveau accessToken si token valide', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([{
      user_id: fakeUser.id,
      email: fakeUser.email,
      role: fakeUser.role,
      first_name: fakeUser.first_name,
      last_name: fakeUser.last_name,
    }]));
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'valid-refresh-token' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });
});

describe('POST /api/auth/logout', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 200 même sans token', async () => {
    const res = await request(app).post('/api/auth/logout').send({});
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/déconnexion/i);
  });

  it('supprime le refresh token de la base', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([]));
    const res = await request(app).post('/api/auth/logout').send({ refreshToken: 'some-token' });
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('DELETE FROM refresh_tokens'),
      expect.arrayContaining(['some-token'])
    );
  });
});

describe('GET /api/auth/profile', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  it('retourne le profil avec token valide', async () => {
    const token = jwt.sign(
      { userId: fakeUser.id, email: fakeUser.email, role: fakeUser.role },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
    mockQuery.mockResolvedValueOnce(makeQueryResult([{
      id: fakeUser.id, email: fakeUser.email,
      first_name: fakeUser.first_name, last_name: fakeUser.last_name, role: fakeUser.role,
    }]));

    const res = await request(app).get('/api/auth/profile').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(fakeUser.email);
    expect(res.body).not.toHaveProperty('password_hash');
  });
});

describe('PUT /api/auth/password', () => {
  let token: string;

  beforeEach(() => {
    mockQuery.mockReset();
    token = jwt.sign(
      { userId: fakeUser.id, email: fakeUser.email, role: fakeUser.role },
      'test_secret_key_for_jest',
      { expiresIn: '1h' }
    );
  });

  it('retourne 401 sans token', async () => {
    const res = await request(app).put('/api/auth/password').send({ currentPassword: 'a', newPassword: 'b' });
    expect(res.status).toBe(401);
  });

  it('retourne 400 si nouveau mot de passe trop court', async () => {
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Admin123!', newPassword: 'court' });
    expect(res.status).toBe(400);
  });

  it('retourne 400 si mot de passe actuel incorrect', async () => {
    mockQuery.mockResolvedValueOnce(makeQueryResult([{ password_hash: fakeUser.password_hash }]));
    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'MauvaisActuel', newPassword: 'NouveauMdp123!' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/actuel/i);
  });

  it('change le mot de passe avec les bonnes credentials', async () => {
    mockQuery
      .mockResolvedValueOnce(makeQueryResult([{ password_hash: fakeUser.password_hash }]))
      .mockResolvedValueOnce(makeQueryResult([{}]));

    const res = await request(app)
      .put('/api/auth/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'Admin123!', newPassword: 'NouveauMdp123!' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/mis à jour/i);
  });
});

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

const fakeCandidate = {
  id: 'cand-uuid-1',
  first_name: 'Marie',
  last_name: 'Martin',
  email: 'marie.martin@gmail.com',
  phone: '+225 0700000001',
  position: 'Auditeur Senior',
  department: 'AUDIT_ASSURANCE',
  status: 'NOUVEAU',
  source: 'LinkedIn',
  notes: 'Profil intéressant',
  interview_date: null,
  salary_expected: 600000,
  created_by: 'user-1',
  created_by_name: 'Alice DRH',
  created_at: '2025-10-01T09:00:00Z',
};

describe('GET /api/recruitment', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/recruitment');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des candidats', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeCandidate]));
    const res = await request(app)
      .get('/api/recruitment')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].first_name).toBe('Marie');
  });

  it('filtre par statut', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeCandidate]));
    const res = await request(app)
      .get('/api/recruitment?status=NOUVEAU')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('c.status'),
      expect.arrayContaining(['NOUVEAU'])
    );
  });

  it('filtre par recherche texte', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeCandidate]));
    const res = await request(app)
      .get('/api/recruitment?search=Marie')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('ILIKE'),
      expect.arrayContaining(['%Marie%'])
    );
  });
});

describe('GET /api/recruitment/stats', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne les stats par statut', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([
        { status: 'NOUVEAU', count: '3' },
        { status: 'ENTRETIEN', count: '2' },
        { status: 'EMBAUCHE', count: '1' },
      ]))
      .mockResolvedValueOnce(makeResult([{ total: '6' }]));

    const res = await request(app)
      .get('/api/recruitment/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('byStatus');
    expect(res.body).toHaveProperty('total');
    expect(res.body.total).toBe(6);
    expect(res.body.byStatus).toHaveLength(3);
  });
});

describe('POST /api/recruitment', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour le rôle UTILISATEUR', async () => {
    const res = await request(app)
      .post('/api/recruitment')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`)
      .send({ first_name: 'Test', last_name: 'User', position: 'Dev' });
    expect(res.status).toBe(403);
  });

  it('retourne 400 si champs obligatoires manquants', async () => {
    const res = await request(app)
      .post('/api/recruitment')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ first_name: 'Marie' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/obligatoires/);
  });

  it('crée un candidat avec statut NOUVEAU par défaut', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeCandidate, status: 'NOUVEAU' }]));
    const res = await request(app)
      .post('/api/recruitment')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ first_name: 'Marie', last_name: 'Martin', position: 'Auditeur Senior' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('NOUVEAU');
  });
});

describe('PUT /api/recruitment/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 404 si candidat inconnu', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .put('/api/recruitment/unknown')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ status: 'ENTRETIEN' });
    expect(res.status).toBe(404);
  });

  it('fait avancer le candidat dans le pipeline', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeCandidate, status: 'ENTRETIEN' }]));
    const res = await request(app)
      .put('/api/recruitment/cand-uuid-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({ status: 'ENTRETIEN' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ENTRETIEN');
  });
});

describe('DELETE /api/recruitment/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour le rôle MANAGER', async () => {
    const res = await request(app)
      .delete('/api/recruitment/cand-uuid-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si candidat inconnu', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .delete('/api/recruitment/unknown')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(404);
  });

  it('supprime le candidat', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'cand-uuid-1' }]));
    const res = await request(app)
      .delete('/api/recruitment/cand-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimé/i);
  });
});

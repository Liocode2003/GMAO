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

const fakeTraining = {
  id: 'training-uuid-1',
  type: 'INTERNE',
  title: 'Formation IFRS',
  date: '2024-06-15',
  duration_hours: 8,
  participant_count: '5',
  participants: [],
};

describe('GET /api/trainings', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/trainings');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des formations', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeTraining]));
    const res = await request(app)
      .get('/api/trainings')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('filtre par année', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeTraining]));
    await request(app)
      .get('/api/trainings?year=2024')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('EXTRACT(YEAR'),
      expect.arrayContaining(['2024'])
    );
  });
});

describe('POST /api/trainings', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour un UTILISATEUR', async () => {
    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`)
      .send(fakeTraining);
    expect(res.status).toBe(403);
  });

  it('crée une formation avec participants', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([fakeTraining]))  // INSERT training
      .mockResolvedValueOnce(makeResult([{}]));           // INSERT participants

    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`)
      .send({
        type: 'INTERNE',
        title: 'Formation IFRS',
        date: '2024-06-15',
        duration_hours: 8,
        participant_ids: ['550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001'],
      });
    expect(res.status).toBe(201);
  });

  it('crée une formation sans participants', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeTraining]));
    const res = await request(app)
      .post('/api/trainings')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .send({ type: 'INTERNE', title: 'Test', date: '2024-01-01' });
    expect(res.status).toBe(201);
  });
});

describe('DELETE /api/trainings/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 403 pour un MANAGER', async () => {
    const res = await request(app)
      .delete(`/api/trainings/${fakeTraining.id}`)
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('supprime la formation pour un DRH', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{}]));
    const res = await request(app)
      .delete(`/api/trainings/${fakeTraining.id}`)
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimée/i);
  });
});

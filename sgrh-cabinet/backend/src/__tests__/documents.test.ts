import request from 'supertest';
import jwt from 'jsonwebtoken';
import * as path from 'path';
import * as fs from 'fs';

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

const fakeDocument = {
  id: 'doc-uuid-1',
  employee_id: 'emp-uuid-1',
  name: 'Contrat CDI',
  type: 'CONTRAT',
  file_path: '/app/uploads/documents/1234567890.pdf',
  file_size: 102400,
  mime_type: 'application/pdf',
  uploaded_by: 'user-1',
  uploaded_by_name: 'Alice DRH',
  created_at: '2025-06-01T10:00:00Z',
};

describe('GET /api/documents/employee/:employee_id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/documents/employee/emp-uuid-1');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des documents d\'un employé', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeDocument]));
    const res = await request(app)
      .get('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe('Contrat CDI');
    expect(res.body[0].type).toBe('CONTRAT');
  });

  it('retourne un tableau vide si aucun document', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .get('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

describe('POST /api/documents/employee/:employee_id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/documents/employee/emp-uuid-1');
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour le rôle UTILISATEUR', async () => {
    const res = await request(app)
      .post('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken('UTILISATEUR')}`)
      .field('name', 'Contrat')
      .field('type', 'CONTRAT');
    expect(res.status).toBe(403);
  });

  it('retourne 400 si aucun fichier', async () => {
    const res = await request(app)
      .post('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .field('name', 'Contrat')
      .field('type', 'CONTRAT');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/fichier/i);
  });

  it('upload un document PDF valide', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeDocument, file_path: '1234567890.pdf' }]));

    const tmpFile = path.join('/tmp', 'test_upload.pdf');
    fs.writeFileSync(tmpFile, '%PDF-1.4 test content');

    const res = await request(app)
      .post('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .field('name', 'Contrat CDI')
      .field('type', 'CONTRAT')
      .attach('file', tmpFile);

    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Contrat CDI');
    expect(res.body.type).toBe('CONTRAT');
  });

  it('rejette un fichier avec extension non autorisée', async () => {
    const tmpFile = path.join('/tmp', 'malware.exe');
    fs.writeFileSync(tmpFile, 'MZ malware content');

    const res = await request(app)
      .post('/api/documents/employee/emp-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`)
      .field('name', 'Fichier dangereux')
      .field('type', 'AUTRE')
      .attach('file', tmpFile);

    fs.unlinkSync(tmpFile);

    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/documents/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/documents/doc-uuid-1');
    expect(res.status).toBe(401);
  });

  it('retourne 403 pour le rôle MANAGER', async () => {
    const res = await request(app)
      .delete('/api/documents/doc-uuid-1')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si document inconnu', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .delete('/api/documents/unknown')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);
    expect(res.status).toBe(404);
  });

  it('supprime le document (retourne 200)', async () => {
    // Le controller fait DELETE RETURNING *, puis tente de supprimer le fichier physique
    mockQuery.mockResolvedValueOnce(makeResult([{ ...fakeDocument }]));

    const res = await request(app)
      .delete('/api/documents/doc-uuid-1')
      .set('Authorization', `Bearer ${makeToken('DRH')}`);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimé/i);
  });
});

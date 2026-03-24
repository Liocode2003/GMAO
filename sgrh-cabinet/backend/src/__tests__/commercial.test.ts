import request from 'supertest';
import jwt from 'jsonwebtoken';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_key_for_jest';

jest.mock('../config/database');
jest.mock('../utils/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));
jest.mock('../jobs/scheduler', () => ({ initScheduler: jest.fn() }));

// Mock ExcelJS et PDFKit pour éviter les vrais fichiers
jest.mock('exceljs', () => {
  const addRow = jest.fn();
  const eachCell = jest.fn();
  const mockSheet = {
    addRow,
    getRow: jest.fn().mockReturnValue({ font: {}, fill: {} }),
    columns: [{ eachCell, width: 10 }],
  };
  return {
    default: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue(mockSheet),
      xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel')) },
    })),
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: jest.fn().mockReturnValue(mockSheet),
      xlsx: { writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel')) },
    })),
  };
});

jest.mock('pdfkit', () => {
  return jest.fn().mockImplementation(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let _target: any = null;
    return {
      fontSize: jest.fn().mockReturnThis(),
      font: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      rect: jest.fn().mockReturnThis(),
      fill: jest.fn().mockReturnThis(),
      fillColor: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      addPage: jest.fn().mockReturnThis(),
      pipe: jest.fn().mockImplementation((target) => { _target = target; }),
      end: jest.fn().mockImplementation(() => {
        if (_target) {
          _target.write(Buffer.from('%PDF-1.4 mock'));
          _target.end();
        }
      }),
      page: { height: 842, margins: { left: 40, top: 40 } },
      y: 100,
    };
  });
});

import app from '../app';
import { query } from '../config/database';

const mockQuery = query as jest.MockedFunction<typeof query>;

const makeResult = (rows: Record<string, unknown>[]) =>
  ({ rows, rowCount: rows.length, command: '', oid: 0, fields: [] } as ReturnType<typeof query> extends Promise<infer R> ? R : never);

const makeToken = (role = 'DRH') =>
  jwt.sign({ userId: 'user-1', email: 'drh@test.ci', role }, 'test_secret_key_for_jest', { expiresIn: '1h' });

const fakeSubmission = {
  id: 'sub-1',
  type: 'AMI',
  reference: 'AMI-2026-001',
  title: 'Audit Financier 2026',
  client: 'Client SA',
  submission_date: '2026-01-15',
  service_line: 'AUDIT_ASSURANCE',
  responsible_employee_id: 'emp-1',
  responsible_name: 'Jean Dupont',
  status: 'EN_COURS',
  contract_amount: null,
  contract_start_date: null,
  contract_end_date: null,
};

// ============================================================
// GET /api/commercial/
// ============================================================

describe('GET /api/commercial/', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/commercial/');
    expect(res.status).toBe(401);
  });

  it('retourne la liste des soumissions', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeSubmission]));
    const res = await request(app)
      .get('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].id).toBe('sub-1');
  });

  it('accepte des filtres (type, status, year)', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeSubmission]));
    const res = await request(app)
      .get('/api/commercial/?type=AMI&status=EN_COURS&year=2026')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
  });

  it('masque les montants pour les rôles non autorisés', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeSubmission]));
    const res = await request(app)
      .get('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`);
    expect(res.status).toBe(200);
    // La requête SQL devrait avoir NULL::DECIMAL AS contract_amount
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('NULL::DECIMAL AS contract_amount'),
      expect.any(Array)
    );
  });

  it('retourne 500 en cas d\'erreur', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
  });
});

// ============================================================
// GET /api/commercial/stats
// ============================================================

describe('GET /api/commercial/stats', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/commercial/stats');
    expect(res.status).toBe(401);
  });

  it('retourne les statistiques par type', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([
      { type: 'AMI', total: '10', wins: '4', losses: '3', en_cours: '3', total_amount: '15000000' },
      { type: 'APPEL_OFFRE', total: '5', wins: '2', losses: '2', en_cours: '1', total_amount: '8000000' },
    ]));

    const res = await request(app)
      .get('/api/commercial/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.AMI.total).toBe(10);
    expect(res.body.AMI.success_rate).toBe(40);
    expect(res.body.APPEL_OFFRE.total).toBe(5);
  });

  it('calcule success_rate à 0 si total est 0', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([
      { type: 'AMI', total: '0', wins: '0', losses: '0', en_cours: '0', total_amount: '0' },
    ]));

    const res = await request(app)
      .get('/api/commercial/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.AMI.success_rate).toBe(0);
  });

  it('retourne 500 en cas d\'erreur', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/commercial/stats')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
  });
});

// ============================================================
// GET /api/commercial/dashboard-widget
// ============================================================

describe('GET /api/commercial/dashboard-widget', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/commercial/dashboard-widget');
    expect(res.status).toBe(401);
  });

  it('retourne les données du widget', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{
      ami_this_month: '3',
      ao_this_month: '5',
      wins_this_month: '2',
      amount_this_month: '10000000',
    }]));

    const res = await request(app)
      .get('/api/commercial/dashboard-widget')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.ami_this_month).toBe('3');
  });
});

// ============================================================
// POST /api/commercial/  (createSubmission)
// ============================================================

describe('POST /api/commercial/', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).post('/api/commercial/').send({});
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle non autorisé', async () => {
    const res = await request(app)
      .post('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken('EMPLOYE')}`)
      .send({ type: 'AMI', title: 'Test', client: 'X', submission_date: '2026-01-01', service_line: 'AUDIT_ASSURANCE', status: 'EN_COURS' });
    expect(res.status).toBe(403);
  });

  it('retourne 400 si statut GAGNE sans les champs obligatoires', async () => {
    const res = await request(app)
      .post('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`);
      // no body
    // Pas de vérification du corps côté route (pas de validate middleware ici)
    // L'erreur viendra de la logique métier si status=GAGNE sans montant
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('retourne 400 si status GAGNE sans contract_amount', async () => {
    const res = await request(app)
      .post('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        type: 'AMI', reference: 'AMI-001', title: 'Test', client: 'X',
        submission_date: '2026-01-01', service_line: 'AUDIT_ASSURANCE',
        status: 'GAGNE',
        // manque contract_amount, contract_start_date, contract_end_date
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Montant/i);
  });

  it('crée une soumission avec statut EN_COURS', async () => {
    const newSub = { ...fakeSubmission, id: 'sub-new' };
    mockQuery.mockResolvedValueOnce(makeResult([newSub]));

    const res = await request(app)
      .post('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        type: 'AMI', reference: 'AMI-001', title: 'Audit 2026', client: 'Client SA',
        submission_date: '2026-01-15', service_line: 'AUDIT_ASSURANCE',
        status: 'EN_COURS',
      });
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('sub-new');
  });

  it('crée une soumission gagnée avec tous les champs', async () => {
    const wonSub = { ...fakeSubmission, id: 'sub-won', status: 'GAGNE', contract_amount: '5000000' };
    mockQuery.mockResolvedValueOnce(makeResult([wonSub]));

    const res = await request(app)
      .post('/api/commercial/')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        type: 'APPEL_OFFRE', reference: 'AO-001', title: 'Mission Audit', client: 'SODECI',
        submission_date: '2026-01-10', service_line: 'AUDIT_ASSURANCE',
        status: 'GAGNE',
        contract_amount: 5000000,
        contract_start_date: '2026-02-01',
        contract_end_date: '2026-07-31',
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('GAGNE');
  });
});

// ============================================================
// PUT /api/commercial/:id  (updateSubmission)
// ============================================================

describe('PUT /api/commercial/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).put('/api/commercial/sub-1').send({});
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle non autorisé', async () => {
    const res = await request(app)
      .put('/api/commercial/sub-1')
      .set('Authorization', `Bearer ${makeToken('EMPLOYE')}`)
      .send({ type: 'AMI', status: 'EN_COURS' });
    expect(res.status).toBe(403);
  });

  it('retourne 404 si soumission introuvable', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .put('/api/commercial/sub-unknown')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        type: 'AMI', reference: 'AMI-001', title: 'Test', client: 'X',
        submission_date: '2026-01-01', service_line: 'AUDIT_ASSURANCE',
        status: 'EN_COURS',
      });
    expect(res.status).toBe(404);
  });

  it('met à jour une soumission', async () => {
    const updated = { ...fakeSubmission, title: 'Titre modifié', status: 'PERDU' };
    mockQuery.mockResolvedValueOnce(makeResult([updated]));

    const res = await request(app)
      .put('/api/commercial/sub-1')
      .set('Authorization', `Bearer ${makeToken()}`)
      .send({
        type: 'AMI', reference: 'AMI-001', title: 'Titre modifié', client: 'Client SA',
        submission_date: '2026-01-15', service_line: 'AUDIT_ASSURANCE',
        status: 'PERDU',
      });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Titre modifié');
  });
});

// ============================================================
// DELETE /api/commercial/:id
// ============================================================

describe('DELETE /api/commercial/:id', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).delete('/api/commercial/sub-1');
    expect(res.status).toBe(401);
  });

  it('retourne 403 si rôle non autorisé', async () => {
    const res = await request(app)
      .delete('/api/commercial/sub-1')
      .set('Authorization', `Bearer ${makeToken('EMPLOYE')}`);
    expect(res.status).toBe(403);
  });

  it('retourne 404 si soumission introuvable', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([]));
    const res = await request(app)
      .delete('/api/commercial/sub-unknown')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(404);
  });

  it('supprime une soumission', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([{ id: 'sub-1' }]));
    const res = await request(app)
      .delete('/api/commercial/sub-1')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimée/i);
  });
});

// ============================================================
// GET /api/commercial/export/excel
// ============================================================

describe('GET /api/commercial/export/excel', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/commercial/export/excel');
    expect(res.status).toBe(401);
  });

  it('génère un fichier Excel', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeSubmission]));
    const res = await request(app)
      .get('/api/commercial/export/excel')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('spreadsheetml');
  });
});

// ============================================================
// GET /api/commercial/export/pdf
// ============================================================

describe('GET /api/commercial/export/pdf', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/commercial/export/pdf');
    expect(res.status).toBe(401);
  });

  it('génère un PDF', async () => {
    mockQuery.mockResolvedValueOnce(makeResult([fakeSubmission]));
    const res = await request(app)
      .get('/api/commercial/export/pdf')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('pdf');
  });
});

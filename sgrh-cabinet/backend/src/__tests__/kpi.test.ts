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

// ============================================================
// GET /api/kpis/dashboard
// ============================================================

describe('GET /api/kpis/dashboard', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/kpis/dashboard');
    expect(res.status).toBe(401);
  });

  it('retourne le dashboard avec toutes les sections', async () => {
    // getDashboard fait 9 requêtes en parallèle + 1 commercialWidget
    const emptyRows = makeResult([]);
    mockQuery
      .mockResolvedValueOnce(makeResult([{ total: '42' }]))         // totalActive
      .mockResolvedValueOnce(makeResult([{ service_line: 'AUDIT_ASSURANCE', count: '10' }])) // byServiceLine
      .mockResolvedValueOnce(makeResult([{ gender: 'M', count: '25', percentage: '60' }]))   // byGender
      .mockResolvedValueOnce(makeResult([{ contract_type: 'CDI', count: '30' }]))            // byContractType
      .mockResolvedValueOnce(makeResult([{ age_group: '25_35', count: '15' }]))              // byAgeGroup
      .mockResolvedValueOnce(makeResult([{ season: '2022', count: '5' }]))                   // bySeason
      .mockResolvedValueOnce(makeResult([{ count: '38' }]))                                  // withEmail
      .mockResolvedValueOnce(emptyRows)                                                      // birthdaysThisMonth
      .mockResolvedValueOnce(emptyRows)                                                      // contractsToRenew
      .mockResolvedValueOnce(makeResult([{                                                   // commercialWidget
        ami_this_month: '3',
        ao_this_month: '5',
        wins_this_month: '2',
        amount_this_month: '5000000',
      }]));

    const res = await request(app)
      .get('/api/kpis/dashboard')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.totalActive).toBe(42);
    expect(res.body.byServiceLine).toHaveLength(1);
    expect(res.body.byGender).toHaveLength(1);
    expect(res.body.withEmail).toBe(38);
  });

  it('retourne le dashboard même si la table commercial n\'existe pas', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ total: '10' }]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([{ count: '10' }]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockRejectedValueOnce(new Error('relation "commercial_submissions" does not exist')); // commercial widget fails

    const res = await request(app)
      .get('/api/kpis/dashboard')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.commercial).toBeNull();
  });

  it('masque les montants commerciaux pour les rôles non autorisés', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{ total: '5' }]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([{ count: '5' }]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([]))
      .mockResolvedValueOnce(makeResult([{
        ami_this_month: '1',
        ao_this_month: '2',
        wins_this_month: '1',
        amount_this_month: '0',
      }]));

    const res = await request(app)
      .get('/api/kpis/dashboard')
      .set('Authorization', `Bearer ${makeToken('MANAGER')}`); // MANAGER ne peut pas voir les montants
    expect(res.status).toBe(200);
  });
});

// ============================================================
// GET /api/kpis/
// ============================================================

describe('GET /api/kpis/', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/kpis/');
    expect(res.status).toBe(401);
  });

  it('retourne les KPIs pour une année', async () => {
    mockQuery
      .mockResolvedValueOnce(makeResult([{  // headcount
        permanent: '30', cdi: '20', cdd: '10', stagiaires: '5',
        prestataires: '3', associes_carl: '2', associes_local: '4',
        hommes: '25', femmes: '15', total: '40',
      }]))
      .mockResolvedValueOnce(makeResult([{ entries: '8', exits: '3' }]))  // movements
      .mockResolvedValueOnce(makeResult([{ type: 'INTERNE', count: '5', total_hours: '40', total_budget: '200000' }])) // trainings
      .mockResolvedValueOnce(makeResult([{ total: '120' }]))              // totalTrainingHours
      .mockResolvedValueOnce(makeResult([{ service_line: 'AUDIT_ASSURANCE', grade: 'SENIOR_1', count: '5' }])) // byServiceAndGrade
      .mockResolvedValueOnce(makeResult([{ diploma_type: 'BAC+5', count: '15' }])) // diplomas
      .mockResolvedValueOnce(makeResult([{ grade: 'SENIOR_1', count: '10' }]))     // byGrade
      .mockResolvedValueOnce(makeResult([{ entries: '8', exits: '3' }]))           // turnover
      .mockResolvedValueOnce(makeResult([{ count: '2' }]))                         // mobilities
      .mockResolvedValueOnce(makeResult([{ indicator_key: 'headcount_target', target_value: '50' }])); // targets

    const res = await request(app)
      .get('/api/kpis/?year=2026')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
    expect(res.body.headcount.total).toBe('40');
    expect(res.body.totalTrainingHours).toBe(120);
    expect(res.body.mobilitiesCount).toBe(2);
    expect(res.body.targets.headcount_target).toBeDefined();
  });

  it('retourne les KPIs avec filtre mois', async () => {
    mockQuery
      .mockResolvedValue(makeResult([{ entries: '2', exits: '1', total: '30', count: '0', permanent: '20', cdi: '15', cdd: '5', stagiaires: '2', prestataires: '1', associes_carl: '1', associes_local: '2', hommes: '18', femmes: '12' }]));

    const res = await request(app)
      .get('/api/kpis/?year=2026&month=3')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.month).toBe(3);
  });

  it('retourne 500 en cas d\'erreur base de données', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/kpis/')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
  });
});

// ============================================================
// GET /api/kpis/monthly
// ============================================================

describe('GET /api/kpis/monthly', () => {
  beforeEach(() => mockQuery.mockReset());

  it('retourne 401 sans token', async () => {
    const res = await request(app).get('/api/kpis/monthly');
    expect(res.status).toBe(401);
  });

  it('retourne les données mensuelles (12 mois)', async () => {
    // getMonthlyKPIs fait 3 queries par mois × 12 mois = 36 queries
    for (let i = 0; i < 36; i++) {
      if (i % 3 === 0) {
        mockQuery.mockResolvedValueOnce(makeResult([{ count: String(i) }])); // entries
      } else if (i % 3 === 1) {
        mockQuery.mockResolvedValueOnce(makeResult([{ count: '0' }])); // exits
      } else {
        mockQuery.mockResolvedValueOnce(makeResult([{ hours: '8' }])); // training hours
      }
    }

    const res = await request(app)
      .get('/api/kpis/monthly?year=2026')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(200);
    expect(res.body.year).toBe(2026);
    expect(Array.isArray(res.body.monthly)).toBe(true);
    expect(res.body.monthly).toHaveLength(12);
    expect(res.body.monthly[0].month).toBe(1);
    expect(res.body.monthly[11].month).toBe(12);
  });

  it('retourne 500 en cas d\'erreur base de données', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app)
      .get('/api/kpis/monthly')
      .set('Authorization', `Bearer ${makeToken()}`);
    expect(res.status).toBe(500);
  });
});

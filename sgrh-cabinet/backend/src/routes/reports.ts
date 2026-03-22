import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticate, authorize } from '../middleware/auth';
import { generateMonthlyReport } from '../services/reportService';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();
router.use(authenticate);

// Liste des rapports générés
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM reports ORDER BY year DESC, month DESC');
    return res.json(result.rows);
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Générer un rapport manuellement
router.post('/generate', authorize('DRH', 'DIRECTION_GENERALE'), async (req: Request, res: Response) => {
  const { year, month } = req.body;

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ error: 'Année et mois valides requis' });
  }

  try {
    const filePath = await generateMonthlyReport(parseInt(year), parseInt(month));
    const filename = path.basename(filePath);

    await query(
      `INSERT INTO reports(name, year, month, file_path, generated_at, status)
       VALUES($1,$2,$3,$4,NOW(),'GENERATED')
       ON CONFLICT DO NOTHING`,
      [filename, year, month, filePath]
    );

    return res.json({ message: 'Rapport généré', filename, filePath });
  } catch (err) {
    logger.error('Erreur génération rapport:', err);
    return res.status(500).json({ error: 'Erreur génération rapport' });
  }
});

// Télécharger un rapport
router.get('/download/:filename', authorize('DRH', 'DIRECTION_GENERALE'), (req: Request, res: Response) => {
  const { filename } = req.params;
  // Sécurité: éviter path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(process.cwd(), 'reports', safeName);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Fichier non trouvé' });
  }

  res.setHeader('Content-Disposition', `attachment; filename="${safeName}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return res.sendFile(filePath);
});

export default router;

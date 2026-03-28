import { Request, Response } from 'express';
import { query } from '../config/database';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'documents');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const uploadDoc = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Format non autorisé (pdf, doc, docx, jpg, png)'));
  },
});

export const listDocuments = async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  try {
    const result = await query(
      `SELECT d.*,
         u.first_name || ' ' || u.last_name as uploaded_by_name
       FROM employee_documents d
       LEFT JOIN users u ON u.id = d.uploaded_by
       WHERE d.employee_id = $1
       ORDER BY d.created_at DESC`,
      [employee_id]
    );
    return res.json(result.rows);
  } catch (err) {
    logger.error('listDocuments error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const uploadDocument = async (req: Request, res: Response) => {
  const { employee_id } = req.params;
  const { name, type } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'Fichier requis' });
  if (!name || !type) return res.status(400).json({ error: 'Nom et type requis' });

  const validTypes = ['CONTRAT', 'AVENANT', 'ATTESTATION', 'DIPLOME', 'AUTRE'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Type invalide' });
  }

  try {
    const result = await query(
      `INSERT INTO employee_documents (employee_id, name, type, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [employee_id, name, type, file.filename, file.size, file.mimetype, req.user?.userId]
    );
    logger.info(`Document uploadé: ${result.rows[0].id} pour employé ${employee_id}`);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    logger.error('uploadDocument error', err);
    if (file) fs.unlinkSync(file.path);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const downloadDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`SELECT * FROM employee_documents WHERE id = $1`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Document non trouvé' });

    const doc = result.rows[0];
    const safeName = path.basename(doc.file_path);
    const filePath = path.join(UPLOADS_DIR, safeName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Fichier introuvable sur le serveur' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.name)}${path.extname(safeName)}"`);
    return res.sendFile(filePath);
  } catch (err) {
    logger.error('downloadDocument error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

export const deleteDocument = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query(`DELETE FROM employee_documents WHERE id = $1 RETURNING *`, [id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Document non trouvé' });

    const doc = result.rows[0];
    const filePath = path.join(UPLOADS_DIR, path.basename(doc.file_path));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    logger.info(`Document ${id} supprimé par ${req.user?.email}`);
    return res.json({ message: 'Document supprimé' });
  } catch (err) {
    logger.error('deleteDocument error', err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
};

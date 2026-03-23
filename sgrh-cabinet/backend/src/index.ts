import 'dotenv/config';

// Fuseau horaire Burkina Faso (GMT+0, même heure toute l'année)
process.env.TZ = 'Africa/Ouagadougou';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { pool } from './config/database';
import routes from './routes';
import { initScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate limiting
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Trop de tentatives. Réessayez dans 15 minutes.' },
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// Start
app.listen(PORT, () => {
  logger.info(`SGRH Cabinet API démarrée sur le port ${PORT}`);
  initScheduler();
});

export default app;

import app from './app';
import { initScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

// Empêche les promesses non gérées de tuer le processus silencieusement
process.on('unhandledRejection', (reason) => {
  logger.error('[PROCESS] Promesse non gérée rejetée:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('[PROCESS] Exception non capturée:', err);
  process.exit(1);
});

app.listen(PORT, () => {
  logger.info(`SGRH Cabinet API démarrée sur le port ${PORT}`);
  initScheduler();
});

export default app;

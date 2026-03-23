import app from './app';
import { initScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`SGRH Cabinet API démarrée sur le port ${PORT}`);
  initScheduler();
});

export default app;

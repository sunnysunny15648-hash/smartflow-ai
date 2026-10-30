import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { startDeadlineCheckerJob } from './jobs/deadlineChecker.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 SmartFlow AI Backend Server running in ${env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/health`);

  // Start background cron jobs
  startDeadlineCheckerJob();
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('Server process terminated successfully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

export default server;


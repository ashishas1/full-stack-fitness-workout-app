import { app } from './app';
import { env } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`=======================================================`);
  logger.info(`🚀 Fitness Platform Backend is running successfully!`);
  logger.info(`🌐 Server URL:        http://localhost:${env.PORT}`);
  logger.info(`📄 Swagger Docs:      http://localhost:${env.PORT}/api/docs`);
  logger.info(`🩺 Health Check:       http://localhost:${env.PORT}/api/health`);
  logger.info(`🌱 Environment:       ${env.NODE_ENV}`);
  logger.info(`=======================================================`);
});

// Graceful Shutdown
async function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed.');

    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('Shutdown timed out, forcefully exiting.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { promise, reason });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception thrown:', error);
  gracefulShutdown('uncaughtException');
});

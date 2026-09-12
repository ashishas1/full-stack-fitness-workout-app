import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'node:path';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { prisma } from './config/database';
import { swaggerSpec } from './config/swagger';
import routes from './routes';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { NotFoundError } from './utils/errors';
import { sendSuccess } from './utils/response';

import { requestIdMiddleware } from './shared/middleware/requestId';

export function createApp(): Express {
  const app = express();

  // Correlation Request ID
  app.use(requestIdMiddleware);

  // Security Middleware
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Middleware
  const allowedOrigins = (env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map((o: string) => o.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id'],
    })
  );

  // Logging
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Global Rate Limiter
  app.use(globalRateLimiter);

  // Static files for uploaded avatars and progress photos
  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  app.use('/uploads', express.static(uploadDir));

  // Swagger Documentation
  app.use(['/api/docs', '/api/v1/docs'], swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get(['/api/docs.json', '/api/v1/docs.json'], (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Health Check Endpoints
  const healthCheckHandler = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      sendSuccess(
        res,
        {
          status: 'UP',
          uptime: process.uptime(),
          timestamp: new Date().toISOString(),
          environment: env.NODE_ENV,
          database: 'CONNECTED',
        },
        'Fitness Backend API is healthy and operational'
      );
    } catch (error) {
      next(error);
    }
  };

  app.get('/health', healthCheckHandler);
  app.get('/api/health', healthCheckHandler);

  // Mount API Routes
  app.use('/api', routes);

  // 404 Handler
  app.use((req: Request, _res: Response, next: NextFunction) => {
    next(new NotFoundError(`Endpoint not found: ${req.method} ${req.originalUrl}`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();

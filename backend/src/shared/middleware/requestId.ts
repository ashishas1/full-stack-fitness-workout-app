import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const incomingId = req.header('X-Request-Id') || req.header('x-request-id');
  const requestId = incomingId || crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}

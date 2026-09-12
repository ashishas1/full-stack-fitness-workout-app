import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/response.js";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational AppError
  if (err instanceof AppError) {
    logger.warn(`Operational Error: ${err.errorCode} - ${err.message}`, {
      details: err.details,
    });
    return sendError(res, err.message, err.errorCode, err.details, err.statusCode);
  }

  // Prisma Unique Constraint Violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[]) || ["field"];
      const message = `A record with this ${target.join(", ")} already exists.`;
      logger.warn(`Prisma P2002: ${message}`);
      return sendError(res, message, "CONFLICT", { fields: target }, 409);
    }
    if (err.code === "P2025") {
      logger.warn(`Prisma P2025: Record not found.`);
      return sendError(res, "Requested record does not exist.", "NOT_FOUND", undefined, 404);
    }
  }

  // Unexpected internal errors
  logger.error("Unhandled Internal Server Error:", {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === "development" ? err.stack : undefined,
  });

  sendError(
    res,
    env.NODE_ENV === "production" ? "An unexpected error occurred on the server." : err.message,
    "INTERNAL_SERVER_ERROR",
    undefined,
    500
  );
}

import { HTTP_STATUS } from "../constants/index.js";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode: string = "INTERNAL_SERVER_ERROR", details?: unknown) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found", details?: unknown) {
    super(message, HTTP_STATUS.NOT_FOUND, "NOT_FOUND", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Authentication required", details?: unknown) {
    super(message, HTTP_STATUS.UNAUTHORIZED, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Access denied", details?: unknown) {
    super(message, HTTP_STATUS.FORBIDDEN, "FORBIDDEN", details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = "Bad request", details?: unknown) {
    super(message, HTTP_STATUS.BAD_REQUEST, "BAD_REQUEST", details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Conflict occurred", details?: unknown) {
    super(message, HTTP_STATUS.CONFLICT, "CONFLICT", details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, HTTP_STATUS.UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", details);
  }
}

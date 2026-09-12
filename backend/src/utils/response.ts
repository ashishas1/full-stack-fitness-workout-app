import { Response } from "express";
import { HTTP_STATUS } from "../constants/index.js";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = HTTP_STATUS.OK
): void {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendCreated<T>(
  res: Response,
  data: T,
  message: string = "Resource created successfully"
): void {
  sendSuccess(res, data, message, HTTP_STATUS.CREATED);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  message?: string
): void {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message,
    data,
    pagination,
  });
}

export function sendError(
  res: Response,
  message: string,
  code: string = "INTERNAL_SERVER_ERROR",
  details?: unknown,
  statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR
): void {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}

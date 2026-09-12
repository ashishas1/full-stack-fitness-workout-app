import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { sendError } from "../utils/response.js";

export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many requests from this IP address. Please try again later.",
      "RATE_LIMIT_EXCEEDED",
      undefined,
      429
    );
  },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 20, // 20 attempts
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendError(
      res,
      "Too many authentication attempts. Please try again in 15 minutes.",
      "AUTH_RATE_LIMIT_EXCEEDED",
      undefined,
      429
    );
  },
});

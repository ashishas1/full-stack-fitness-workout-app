import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres@127.0.0.1:5433/fitness_backend_db?schema=public",
  JWT_SECRET: process.env.JWT_SECRET || "super_secret_jwt_access_key_sixforge_2026",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "15m",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "super_secret_jwt_refresh_key_sixforge_2026",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  STORAGE_PROVIDER: (process.env.STORAGE_PROVIDER as "local" | "s3" | "cloudinary") || "local",
  UPLOAD_DIR: process.env.UPLOAD_DIR || "uploads",
  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB || "10", 10),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000", 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "200", 10),
} as const;

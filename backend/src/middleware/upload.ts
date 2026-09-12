import multer from "multer";
import { env } from "../config/env.js";
import { BadRequestError } from "../utils/errors.js";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError(`Unsupported file type: ${file.mimetype}. Only images and MP4 videos are allowed.`));
    }
  },
});

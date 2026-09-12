import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { BadRequestError } from "../utils/errors.js";

export interface StorageFile {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
}

export interface IStorageService {
  saveFile(buffer: Buffer, originalName: string, mimeType: string, folder?: string): Promise<StorageFile>;
  saveMulterFile(file: Express.Multer.File, folder?: string): Promise<StorageFile>;
  deleteFile(storageKey: string): Promise<void>;
  getFileUrl(storageKey: string): string;
}

export class LocalStorageService implements IStorageService {
  private uploadRoot: string;

  constructor() {
    this.uploadRoot = path.resolve(process.cwd(), env.UPLOAD_DIR);
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadRoot, { recursive: true });
    } catch {
      // already exists
    }
  }

  public async saveFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = "general"
  ): Promise<StorageFile> {
    const ext = path.extname(originalName).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4"];
    if (!allowedExts.includes(ext)) {
      throw new BadRequestError(`File format ${ext} is not supported. Allowed formats: ${allowedExts.join(", ")}`);
    }

    const targetDir = path.join(this.uploadRoot, folder);
    await fs.mkdir(targetDir, { recursive: true });

    const randomName = `${crypto.randomUUID()}${ext}`;
    const filePath = path.join(targetDir, randomName);
    const storageKey = path.join(folder, randomName).replace(/\\/g, "/");

    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${storageKey}`;
    return {
      filename: randomName,
      originalName,
      mimeType,
      size: buffer.length,
      url,
      storageKey,
    };
  }

  public async saveMulterFile(file: Express.Multer.File, folder: string = "general"): Promise<StorageFile> {
    return this.saveFile(file.buffer, file.originalname, file.mimetype, folder);
  }

  public async deleteFile(storageKey: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadRoot, storageKey);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  public getFileUrl(storageKey: string): string {
    return `/uploads/${storageKey.replace(/\\/g, "/")}`;
  }
}

export const storageService: IStorageService = new LocalStorageService();

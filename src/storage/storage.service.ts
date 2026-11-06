import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
  'video/webm': '.webm',
  'video/mp4': '.mp4',
  'video/quicktime': '.mov',
};

@Injectable()
export class StorageService {
  constructor(private readonly config: ConfigService) {}

  async savePrivate(
    userId: string,
    purpose: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const root = resolve(this.config.get<string>('UPLOAD_DIR', 'uploads'));
    const directory = join(root, userId);
    await mkdir(directory, { recursive: true });
    const extension =
      MIME_EXTENSIONS[file.mimetype] ||
      extname(file.originalname).toLowerCase();
    const filename = `${purpose}-${randomUUID()}${extension}`;
    await writeFile(join(directory, filename), file.buffer, { flag: 'wx' });
    return join(userId, filename).replaceAll('\\', '/');
  }
}

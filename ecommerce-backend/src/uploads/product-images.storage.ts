import { existsSync, mkdirSync } from 'fs';
import { unlink } from 'fs/promises';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const PRODUCT_IMAGES_DIR = join(process.cwd(), 'uploads', 'products');

export const productImagesMulterOptions: MulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      if (!existsSync(PRODUCT_IMAGES_DIR)) {
        mkdirSync(PRODUCT_IMAGES_DIR, { recursive: true });
      }
      cb(null, PRODUCT_IMAGES_DIR);
    },
    filename: (_req, file, cb) => {
      cb(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (
      file.fieldname !== 'images' &&
      !/^variantImage_\d+$/.test(file.fieldname)
    ) {
      cb(
        new BadRequestException(
          'Use field "images" for product photos and "variantImage_0", "variantImage_1", ... for optional variant photos',
        ),
        false,
      );
      return;
    }
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(
        new BadRequestException(
          'Only jpeg, png, webp, and gif images are allowed',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 40,
  },
};

export function splitProductUploadFiles(files: Express.Multer.File[]) {
  const productFiles: Express.Multer.File[] = [];
  const variantFiles = new Map<number, Express.Multer.File>();

  for (const file of files) {
    if (file.fieldname === 'images') {
      productFiles.push(file);
      continue;
    }

    const match = /^variantImage_(\d+)$/.exec(file.fieldname);
    if (match) {
      variantFiles.set(Number(match[1]), file);
    }
  }

  return { productFiles, variantFiles };
}

export function toProductImageUrl(
  file?: Express.Multer.File,
): string | undefined {
  if (!file) return undefined;
  return toProductImageUrls([file])[0];
}

export function toProductImageUrls(files: Express.Multer.File[]): string[] {
  const base = (process.env.APP_URL ?? 'http://localhost:8000').replace(
    /\/$/,
    '',
  );
  return files.map((file) => `${base}/uploads/products/${file.filename}`);
}

export async function deleteProductImageFiles(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {
      const marker = '/uploads/products/';
      const index = url.lastIndexOf(marker);
      if (index === -1) return;

      const filename = url.slice(index + marker.length);
      if (!filename || filename.includes('/') || filename.includes('\\')) {
        return;
      }

      await unlink(join(PRODUCT_IMAGES_DIR, filename)).catch(() => undefined);
    }),
  );
}

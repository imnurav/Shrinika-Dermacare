import { ImageKit, toFile } from '@imagekit/nodejs';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import {
  InternalServerErrorException,
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

type UploadFolder = 'users' | 'categories' | 'services';
type BulkUploadResult = {
  uploaded: Array<{ index: number; url: string; originalName: string }>;
  failed: Array<{ index: number; originalName: string; reason: string }>;
};
type BulkDeleteResult = {
  deleted: string[];
  failed: Array<{ url: string; reason: string }>;
};

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly imageKit: ImageKit;

  constructor(private readonly configService: ConfigService) {
    const privateKey = this.configService.get<string>('IMAGE_KIT_PRIVATE_KEY');
    const publicKey = this.configService.get<string>('IMAGE_KIT_PUBLIC_KEY');

    if (!privateKey || !publicKey) {
      throw new InternalServerErrorException(
        'ImageKit configuration is missing. Check IMAGE_KIT_PRIVATE_KEY and IMAGE_KIT_PUBLIC_KEY.',
      );
    }

    this.imageKit = new ImageKit({
      privateKey,
    });
  }

  async saveFile(file: Express.Multer.File, folder: UploadFolder): Promise<string> {
    if (!file) throw new BadRequestException('No file provided');

    const fileExtension = extname(file.originalname) || '';
    const fileName = `${folder}-${randomUUID()}${fileExtension}`;

    try {
      const response = await this.imageKit.files.upload({
        file: await toFile(file.buffer, fileName),
        fileName,
        folder: `/${folder}`,
        useUniqueFileName: false,
      });
      if (!response.url) throw new Error('ImageKit did not return a file URL');
      return response.url;
    } catch (error) {
      this.logger.error(`Failed to upload file to ImageKit (${folder})`, error as any);
      throw new InternalServerErrorException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl) throw new BadRequestException('No fileUrl provided');
    try {
      const parsed = new URL(fileUrl);
      const pathname = decodeURIComponent(parsed.pathname);
      const fileName = pathname.split('/').pop();
      if (!fileName) return;
      const folderPath = pathname.split('/').slice(-2, -1)[0];
      const searchQuery = folderPath
        ? `name = "${fileName}" AND path = "/${folderPath}"`
        : `name = "${fileName}"`;

      const assets = await this.imageKit.assets.list({
        type: 'file',
        limit: 20,
        searchQuery,
      });

      const matched = assets.filter(
        (asset) =>
          asset.type === 'file' &&
          asset.url &&
          this.normalizeUrl(asset.url) === this.normalizeUrl(fileUrl),
      );

      const targets =
        matched.length > 0 ? matched : assets.filter((asset) => asset.type === 'file');

      await Promise.allSettled(
        targets
          .filter(
            (asset): asset is typeof asset & { type: 'file'; fileId: string } =>
              asset.type === 'file' && typeof asset.fileId === 'string' && asset.fileId.length > 0,
          )
          .map((asset) => this.imageKit.files.delete(asset.fileId)),
      );
    } catch (error) {
      this.logger.warn(`Failed to delete file from ImageKit: ${fileUrl}`);
      this.logger.debug(error as any);
    }
  }

  async bulkUploadFiles(
    files: Express.Multer.File[],
    folder: UploadFolder,
  ): Promise<BulkUploadResult> {
    if (!files?.length) throw new BadRequestException('No files provided');
    const settled = await Promise.allSettled(files.map((file) => this.saveFile(file, folder)));
    const result: BulkUploadResult = { uploaded: [], failed: [] };
    settled.forEach((item, index) => {
      const originalName = files[index]?.originalname || `file-${index}`;
      if (item.status === 'fulfilled') {
        result.uploaded.push({ index, url: item.value, originalName });
      } else {
        result.failed.push({
          index,
          originalName,
          reason: item.reason instanceof Error ? item.reason.message : 'Upload failed',
        });
      }
    });
    return result;
  }

  async bulkDeleteFiles(fileUrls: string[]): Promise<BulkDeleteResult> {
    if (!fileUrls?.length) throw new BadRequestException('No file URLs provided');
    const settled = await Promise.allSettled(fileUrls.map((fileUrl) => this.deleteFile(fileUrl)));
    const result: BulkDeleteResult = { deleted: [], failed: [] };
    settled.forEach((item, index) => {
      const url = fileUrls[index];
      if (item.status === 'fulfilled') {
        result.deleted.push(url);
      } else {
        result.failed.push({
          url,
          reason: item.reason instanceof Error ? item.reason.message : 'Delete failed',
        });
      }
    });
    return result;
  }

  private normalizeUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.origin}${parsed.pathname}`;
    } catch {
      return url;
    }
  }
}

import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    // Create uploads directory if it doesn't exist
    this.uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }

    // Create subdirectories for different types
    const subdirs = ['users', 'categories', 'services'];
    subdirs.forEach((dir) => {
      const dirPath = path.join(this.uploadPath, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });
  }

  async saveFile(
    file: Express.Multer.File,
    folder: 'users' | 'categories' | 'services',
  ): Promise<string> {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname);
    const fileName = `${randomUUID()}${fileExt}`;
    const folderPath = path.join(this.uploadPath, folder);
    const filePath = path.join(folderPath, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Return URL path (relative to uploads folder)
    // In production, you would return the full URL from your CDN/storage service
    const baseUrl = this.configService.get<string>('BASE_URL') || 'http://localhost:3000';
    return `${baseUrl}/uploads/${folder}/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = fileUrl.split('/uploads/');
      if (urlParts.length === 2) {
        const filePath = path.join(this.uploadPath, urlParts[1]);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error, just log it
    }
  }

  getUploadPath(): string {
    return this.uploadPath;
  }
}

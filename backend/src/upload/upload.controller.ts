import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import {
  BadRequestException,
  UseInterceptors,
  UploadedFile,
  Controller,
  Delete,
  Param,
  Query,
  Post,
} from '@nestjs/common';

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('image/:folder')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload an image file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Param('folder') folder: 'users' | 'categories' | 'services',
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!['users', 'categories', 'services'].includes(folder)) {
      throw new BadRequestException('Invalid folder. Must be: users, categories, or services');
    }

    const fileUrl = await this.uploadService.saveFile(file, folder);

    return {
      url: fileUrl,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  @Delete('image')
  @ApiOperation({ summary: 'Delete an image file' })
  async deleteImage(@Query('url') url: string) {
    if (!url) {
      throw new BadRequestException('URL parameter is required');
    }
    await this.uploadService.deleteFile(url);
    return { message: 'File deleted successfully' };
  }
}

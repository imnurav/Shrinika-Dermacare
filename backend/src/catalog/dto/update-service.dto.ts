import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsBoolean,
  IsString,
  IsNumber,
  IsUUID,
  IsInt,
  Matches,
  Min,
} from 'class-validator';

export class UpdateServiceDto {
  @ApiPropertyOptional({ example: 'uuid-of-category' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: 'Haircut & Styling' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Professional haircut with styling' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/haircut.jpg',
    description: 'Service image URL',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/.+|\/uploads\/.*)$/, { message: 'imageUrl must be a valid URL or upload path' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: 60, description: 'Duration in minutes' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ example: 500.0, description: 'Price for future payments' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

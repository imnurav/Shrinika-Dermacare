import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Hair Care' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Professional hair care services' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/images/hair-care.jpg',
    description: 'Category image URL',
  })
  @IsOptional()
  @IsString()
  @Matches(/^(https?:\/\/.+|\/uploads\/.*)$/, { message: 'imageUrl must be a valid URL or upload path' })
  imageUrl?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

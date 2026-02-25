import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GetServicesQueryDto {
  @ApiPropertyOptional({ type: String, description: 'Search by service title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';

export class GetBookingsQueryDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional({ type: String, description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ type: String, description: 'YYYY-MM-DD' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;
}

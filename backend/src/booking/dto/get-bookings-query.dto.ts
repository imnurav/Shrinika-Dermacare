import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '../entities/booking.entity';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetBookingsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, description: 'Search by person name or phone' })
  @IsOptional()
  @IsString()
  search?: string;

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
}

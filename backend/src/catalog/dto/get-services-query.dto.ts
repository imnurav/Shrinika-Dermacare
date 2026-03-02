import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetServicesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, description: 'Search by service title or description' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ type: String, description: 'Filter by category ID' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

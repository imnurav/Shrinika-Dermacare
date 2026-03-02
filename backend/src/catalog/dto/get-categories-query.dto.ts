import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetCategoriesQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, description: 'Search by category name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Include services in response (true/false)',
  })
  @IsOptional()
  @IsString()
  includeServices?: string;
}

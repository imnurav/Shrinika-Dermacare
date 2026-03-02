import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class GetUsersQueryDto extends PaginationDto {
  @ApiPropertyOptional({ type: String, description: 'Search by name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;
}

import { IsIn, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export const SORT_ORDERS = ['ASC', 'DESC'] as const;
export type SortOrder = (typeof SORT_ORDERS)[number];

export class SortQueryDto {
  @ApiPropertyOptional({ enum: SORT_ORDERS, default: 'DESC' })
  @IsOptional()
  @IsIn(SORT_ORDERS)
  sortOrder?: SortOrder;

  @ApiPropertyOptional({ type: String, description: 'Field name for sorting' })
  @IsOptional()
  @IsString()
  sortBy?: string;
}

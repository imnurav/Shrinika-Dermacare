import { IsArray, IsISO8601, IsOptional, IsString } from 'class-validator';

export class UpdateBookingDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsString()
  personName?: string;

  @IsOptional()
  @IsString()
  personPhone?: string;

  // Accept ISO date (YYYY-MM-DD) or full ISO datetime
  @IsOptional()
  @IsISO8601()
  preferredDate?: string;

  @IsOptional()
  @IsString()
  preferredTime?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  serviceIds?: string[];
}

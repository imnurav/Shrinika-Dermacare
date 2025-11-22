import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  ArrayMinSize,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({
    example: ['uuid-of-service-1', 'uuid-of-service-2'],
    description: 'Array of service IDs',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  serviceIds: string[];

  @ApiProperty({ example: 'uuid-of-address' })
  @IsUUID()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ example: '2024-12-25', description: 'Preferred date in YYYY-MM-DD format' })
  @IsDateString()
  preferredDate: string;

  @ApiProperty({ example: '10:00 AM', description: 'Preferred time' })
  @IsString()
  @IsNotEmpty()
  preferredTime: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  personName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  personPhone: string;

  @ApiPropertyOptional({ example: 'Please call before arriving' })
  @IsOptional()
  @IsString()
  notes?: string;
}

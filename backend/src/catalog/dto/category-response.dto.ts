import { ServiceResponseDto } from './service-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, example: 'https://example.com/images/hair-care.jpg' })
  imageUrl?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class CategoryWithServicesDto extends CategoryResponseDto {
  @ApiProperty({ type: () => [ServiceResponseDto] })
  services: ServiceResponseDto[];
}

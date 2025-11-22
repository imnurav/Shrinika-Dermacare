import { CategoryResponseDto } from './category-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty({ required: false, example: 'https://example.com/images/haircut.jpg' })
  imageUrl?: string;

  @ApiProperty()
  duration: number;

  @ApiProperty()
  price: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ type: () => CategoryResponseDto, required: false })
  category?: CategoryResponseDto;
}

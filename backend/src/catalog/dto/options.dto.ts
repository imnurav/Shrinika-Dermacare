import { ApiProperty } from '@nestjs/swagger';

export class CategoryOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

export class ServiceOptionDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  categoryId: string;
}

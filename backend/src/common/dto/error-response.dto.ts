import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty()
  statusCode: number;

  @ApiProperty()
  message: string | string[];

  @ApiProperty()
  error: string;

  @ApiProperty({ required: false })
  timestamp?: string;

  @ApiProperty({ required: false })
  path?: string;
}

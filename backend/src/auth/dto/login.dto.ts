import { IsString, IsEmail, MinLength, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john@example.com', required: false })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @ValidateIf((o) => !o.email)
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;
}

import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserGender, UserRole } from '../../user/entities/user.entity';

export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsEnum(UserGender)
  gender?: UserGender;
}

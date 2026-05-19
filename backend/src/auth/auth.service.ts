import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto';
import { EmailService } from '@/common/services/email/email.services';
import { User, UserGender } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dto/register.dto';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly debugAuthLogs = process.env.DEBUG_AUTH_LOGS === 'true';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) { }

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { name, email, phone, password, imageUrl, gender } = registerDto;

    // Check if user already exists
    if (email) {
      const existingUserByEmail = await this.userRepository.findOne({ where: { email } });
      if (existingUserByEmail) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (phone) {
      const existingUserByPhone = await this.userRepository.findOne({ where: { phone } });
      if (existingUserByPhone) {
        throw new ConflictException('User with this phone already exists');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const createdUser = await this.userRepository.save(
      this.userRepository.create({
        name,
        email,
        phone,
        password: hashedPassword,
        imageUrl,
        gender: gender ?? UserGender.OTHER,
      }),
    );

    const user: UserResponseDto = {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      phone: createdUser.phone,
      imageUrl: createdUser.imageUrl,
      gender: createdUser.gender,
      role: createdUser.role,
    };

    // Generate JWT token
    const accessToken = await this.generateToken(user.id, user.email, user.phone);
    if (this.debugAuthLogs) {
      this.logger.log(`register user created userId=${user.id} role=${user.role}`);
    }

    return {
      accessToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, phone, password } = loginDto;

    if (!email && !phone) {
      if (this.debugAuthLogs) {
        this.logger.warn('login failed missing identifier');
      }
      throw new UnauthorizedException('Email or phone is required');
    }

    // Find user
    const user = await this.userRepository.findOne({
      where: email ? { email } : { phone },
    });

    if (!user) {
      if (this.debugAuthLogs) {
        this.logger.warn(`login failed user not found by=${email ? 'email' : 'phone'}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      if (this.debugAuthLogs) {
        this.logger.warn(`login failed invalid password userId=${user.id}`);
      }
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const accessToken = await this.generateToken(user.id, user.email, user.phone);

    const userResponse: UserResponseDto = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      imageUrl: user.imageUrl,
      gender: user.gender,
      role: user.role,
    };
    if (this.debugAuthLogs) {
      this.logger.log(`login success userId=${user.id} role=${user.role}`);
    }

    return {
      accessToken,
      user: userResponse,
    };
  }

  async requestPasswordReset({ email, phone }: { email?: string; phone?: string }): Promise<void> {
    if (!email && !phone) {
      throw new BadRequestException('Email or phone is required');
    }

    const user = await this.userRepository.findOne({
      where: email ? { email } : { phone },
    });

    if (!user || !user.email) {
      // For security, do not reveal whether the user exists or has an email
      return;
    }

    const resetToken = await this.generateResetToken(user.id, user.email, user.phone);
    await this.emailService.sendForgotPasswordEmail(user.email, resetToken);
  }

  async resetPassword(resetPasswordDto: { token: string; newPassword: string }): Promise<void> {
    const { token, newPassword } = resetPasswordDto;
    let payload: { sub: string; email?: string; phone?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_RESET_SECRET'),
      });
    } catch (error) {
      if (this.debugAuthLogs) {
        this.logger.warn('reset password token invalid or expired');
      }
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const user = await this.userRepository.findOne({ where: { id: payload.sub } });
    if (!user || user.email !== payload.email || user.phone !== payload.phone) {
      throw new UnauthorizedException('Invalid reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user.id, { password: hashedPassword });

    if (this.debugAuthLogs) {
      this.logger.log(`password reset completed userId=${user.id}`);
    }
  }

  private async generateResetToken(userId: string, email: string, phone: string): Promise<string> {
    return this.jwtService.signAsync(
      { sub: userId, email, phone },
      { expiresIn: '15m', secret: this.configService.get<string>('JWT_RESET_SECRET') },
    );
  }
  private async generateToken(userId: string, email?: string, phone?: string): Promise<string> {
    const payload = { sub: userId, email, phone };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN') || '24h',
    });
  }
}

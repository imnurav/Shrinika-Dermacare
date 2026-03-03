import { Controller, Post, Body, HttpCode, HttpStatus, Res, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly debugAuthLogs = process.env.DEBUG_AUTH_LOGS === 'true';

  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  private getCookieOptions() {
    const secureConfig = this.configService.get<string>('COOKIE_SECURE');
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || '';
    const secure =
      typeof secureConfig === 'string'
        ? secureConfig === 'true'
        : frontendUrl.startsWith('https://');
    return {
      httpOnly: true,
      secure,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 7,
    };
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists', type: ErrorResponseDto })
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authResponse = await this.authService.register(registerDto);
    const cookieOptions = this.getCookieOptions();
    res.cookie('access_token', authResponse.accessToken, cookieOptions);
    if (this.debugAuthLogs) {
      this.logger.log(
        `register success userId=${authResponse.user.id} role=${authResponse.user.role} cookieSecure=${cookieOptions.secure}`,
      );
    }
    return authResponse;
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials', type: ErrorResponseDto })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthResponseDto> {
    const authResponse = await this.authService.login(loginDto);
    const cookieOptions = this.getCookieOptions();
    res.cookie('access_token', authResponse.accessToken, cookieOptions);
    if (this.debugAuthLogs) {
      this.logger.log(
        `login success userId=${authResponse.user.id} role=${authResponse.user.role} cookieSecure=${cookieOptions.secure}`,
      );
    }
    return authResponse;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Res({ passthrough: true }) res: Response): { message: string } {
    const options = this.getCookieOptions();
    res.clearCookie('access_token', {
      httpOnly: options.httpOnly,
      secure: options.secure,
      sameSite: options.sameSite,
      path: options.path,
    });
    if (this.debugAuthLogs) {
      this.logger.log(`logout success cookieCleared path=${options.path} secure=${options.secure}`);
    }
    return { message: 'Logged out successfully' };
  }
}

import { Controller, Post, Body, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ErrorResponseDto } from '../common/dto/error-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { AuthResponseDto } from './dto/auth-response.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  private readonly debugAuthLogs = process.env.DEBUG_AUTH_LOGS === 'true';

  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'User already exists', type: ErrorResponseDto })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    const authResponse = await this.authService.register(registerDto);
    if (this.debugAuthLogs) {
      this.logger.log(
        `register success userId=${authResponse.user.id} role=${authResponse.user.role}`,
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
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const authResponse = await this.authService.login(loginDto);
    if (this.debugAuthLogs) {
      this.logger.log(
        `login success userId=${authResponse.user.id} role=${authResponse.user.role}`,
      );
    }
    return authResponse;
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(): { message: string } {
    if (this.debugAuthLogs) {
      this.logger.log('logout success');
    }
    return { message: 'Logged out successfully' };
  }
}

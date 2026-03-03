import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { User } from '../../user/entities/user.entity';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Request } from 'express';

function extractTokenFromCookie(req: Request): string | null {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((item) => item.trim());
  const tokenPair = parts.find((item) => item.startsWith('access_token='));
  if (!tokenPair) return null;
  const raw = tokenPair.substring('access_token='.length);
  return raw ? decodeURIComponent(raw) : null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);
  private readonly debugAuthLogs = process.env.DEBUG_AUTH_LOGS === 'true';

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const token = extractTokenFromCookie(request);
          if (this.debugAuthLogs) {
            this.logger.log(
              `JWT extractors - hasCookieToken=${Boolean(token)} hasHeaderToken=${Boolean(
                ExtractJwt.fromAuthHeaderAsBearerToken()(request),
              )}`,
            );
          }
          return token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; email?: string; phone?: string }) {
    if (this.debugAuthLogs) {
      this.logger.log(`JWT validate payload sub=${payload?.sub || 'unknown'}`);
    }
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        imageUrl: true,
        role: true,
      },
    });

    if (!user) {
      if (this.debugAuthLogs) {
        this.logger.warn(
          `JWT validate failed. user not found for sub=${payload?.sub || 'unknown'}`,
        );
      }
      throw new UnauthorizedException();
    }

    if (this.debugAuthLogs) {
      this.logger.log(`JWT validate success userId=${user.id} role=${user.role}`);
    }

    return user;
  }
}

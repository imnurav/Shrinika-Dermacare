import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly debugAuthLogs = process.env.DEBUG_AUTH_LOGS === 'true';

  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      if (this.debugAuthLogs) {
        this.logger.log(`public route skip auth method=${request?.method} path=${request?.url}`);
      }
      return true;
    }
    if (this.debugAuthLogs) {
      const hasCookie = Boolean(request?.headers?.cookie?.includes('access_token='));
      const hasAuthHeader = Boolean(request?.headers?.authorization);
      this.logger.log(
        `auth guard method=${request?.method} path=${request?.url} hasCookie=${hasCookie} hasAuthHeader=${hasAuthHeader}`,
      );
    }
    return super.canActivate(context);
  }
}

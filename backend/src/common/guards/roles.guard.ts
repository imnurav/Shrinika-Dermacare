import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();

    // SUPERADMIN bypasses role checks.
    // Use the string literal here so the code compiles even before running `prisma generate`
    // to update the generated `UserRole` enum after changing `schema.prisma`.

    if (user && user.role === 'SUPERADMIN') return true;
    return requiredRoles.some((role) => user.role === role);
  }
}

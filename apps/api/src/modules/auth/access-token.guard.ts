import { CanActivate, Injectable, UnauthorizedException } from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: import('@nestjs/common').ExecutionContext) {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const authenticatedRequest = request as AuthenticatedRequest;
    const token = request.cookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    // Сервер сам определяет пользователя по проверенному токену.
    authenticatedRequest.currentUser = await this.authService.getUserFromAccessToken(token);

    return true;
  }
}

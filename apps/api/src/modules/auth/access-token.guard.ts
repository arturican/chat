import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import { AppException } from '../../common/exceptions/app-exception';
import { AuthService } from './auth.service';
import type { AuthenticatedRequest } from './auth.types';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & Partial<AuthenticatedRequest>>();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      throw new AppException({
        status: 401,
        code: 'unauthorized',
        message: 'Access token is required.',
      });
    }

    const token = authorizationHeader.slice('Bearer '.length);
    const payload = await this.authService.verifyAccessToken(token);

    request.authUser = payload;

    return true;
  }
}

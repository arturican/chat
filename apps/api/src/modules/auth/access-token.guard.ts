import { Inject, Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { FastifyRequest } from 'fastify';

import { AppException } from '../../common/exceptions/app-exception';
import type { AppConfig } from '../../config/app-config';
import { APP_CONFIG } from '../../config/app-config.constants';
import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

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

    try {
      const payload = await this.jwtService.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.jwtAccessSecret,
      });

      if (payload.tokenType !== 'access') {
        throw new Error('Unexpected token type.');
      }

      request.authUser = payload;

      return true;
    } catch {
      throw new AppException({
        status: 401,
        code: 'unauthorized',
        message: 'Access token is invalid or expired.',
      });
    }
  }
}

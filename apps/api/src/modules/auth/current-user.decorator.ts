import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';

import type { AccessTokenPayload, AuthenticatedRequest } from './auth.types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AccessTokenPayload => {
    const request = context
      .switchToHttp()
      .getRequest<FastifyRequest & Partial<AuthenticatedRequest>>();

    if (!request.authUser) {
      throw new Error('Current user is not available on the request.');
    }

    return request.authUser;
  },
);

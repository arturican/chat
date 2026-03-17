import type { FastifyRequest } from 'fastify';

export type AuthTokenPayload = {
  sub: number;
};

export type CurrentUser = {
  id: number;
  email: string;
  createdAt: Date;
};

export type AuthenticatedRequest = FastifyRequest & {
  currentUser: CurrentUser;
};

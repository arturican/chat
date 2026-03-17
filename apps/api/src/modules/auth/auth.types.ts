export interface AccessTokenPayload {
  sub: string;
  sessionId: string;
  tokenType: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  sessionId: string;
  tokenType: 'refresh';
}

export interface RequestContext {
  userAgent: string | null;
  ipAddress: string | null;
}

export interface AuthenticatedRequest {
  authUser: AccessTokenPayload;
}

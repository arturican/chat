import type { CookieSerializeOptions } from '@fastify/cookie';

import type { AppConfig } from '../../config/app-config';

export const REFRESH_TOKEN_COOKIE_NAME = 'pulsechat_refresh_token';
export const REFRESH_TOKEN_COOKIE_PATH = '/api/auth';

export function createRefreshCookieOptions(config: AppConfig): CookieSerializeOptions {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.nodeEnv === 'production',
    path: REFRESH_TOKEN_COOKIE_PATH,
  };
}

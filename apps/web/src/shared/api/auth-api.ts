import type {
  AuthResponse,
  LoginRequest,
  MeResponse,
  RefreshResponse,
  RegisterRequest,
} from '@pulsechat/contracts';

import { apiRequest } from './api-client';

export function registerWithPassword(payload: RegisterRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: payload,
    credentials: 'include',
  });
}

export function loginWithPassword(payload: LoginRequest): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: payload,
    credentials: 'include',
  });
}

export function refreshSession(): Promise<RefreshResponse> {
  return apiRequest<RefreshResponse>('/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

export function logoutSession(): Promise<void> {
  return apiRequest<void>('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export function getCurrentUser(accessToken: string): Promise<MeResponse> {
  return apiRequest<MeResponse>('/me', {
    accessToken,
  });
}

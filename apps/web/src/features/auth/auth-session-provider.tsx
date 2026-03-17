'use client';

import type { AuthResponse, LoginRequest, PublicUser, RegisterRequest } from '@pulsechat/contracts';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useEffectEvent, useRef, useState } from 'react';

import {
  getCurrentUser,
  loginWithPassword,
  logoutSession,
  refreshSession,
  registerWithPassword,
} from '../../shared/api/auth-api';
import { ApiClientError } from '../../shared/api/api-client';

type AuthSessionStatus = 'bootstrapping' | 'authenticated' | 'guest' | 'error';

interface AuthSessionContextValue {
  status: AuthSessionStatus;
  user: PublicUser | null;
  accessToken: string | null;
  errorMessage: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  retryBootstrap: () => void;
}

interface AuthSessionProviderProps {
  children: ReactNode;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

function getAuthErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to complete the auth request right now.';
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [status, setStatus] = useState<AuthSessionStatus>('bootstrapping');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasBootstrappedRef = useRef(false);

  const resetToGuest = useEffectEvent(() => {
    setStatus('guest');
    setUser(null);
    setAccessToken(null);
    setErrorMessage(null);
  });

  const applyAuthResponse = useEffectEvent((response: AuthResponse) => {
    setStatus('authenticated');
    setUser(response.user);
    setAccessToken(response.accessToken);
    setErrorMessage(null);
  });

  const bootstrapSession = useEffectEvent(async () => {
    setStatus('bootstrapping');
    setErrorMessage(null);

    try {
      const refreshResponse = await refreshSession();
      const meResponse = await getCurrentUser(refreshResponse.accessToken);

      setStatus('authenticated');
      setUser(meResponse.user);
      setAccessToken(refreshResponse.accessToken);
      setErrorMessage(null);
    } catch (error) {
      if (isUnauthorizedError(error)) {
        resetToGuest();
        return;
      }

      setStatus('error');
      setUser(null);
      setAccessToken(null);
      setErrorMessage(getAuthErrorMessage(error));
    }
  });

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    void bootstrapSession();
  }, [bootstrapSession]);

  const contextValue: AuthSessionContextValue = {
    status,
    user,
    accessToken,
    errorMessage,
    login: async (payload) => {
      const response = await loginWithPassword(payload);

      applyAuthResponse(response);
    },
    register: async (payload) => {
      const response = await registerWithPassword(payload);

      applyAuthResponse(response);
    },
    logout: async () => {
      await logoutSession();
      resetToGuest();
    },
    retryBootstrap: () => {
      void bootstrapSession();
    },
  };

  return <AuthSessionContext.Provider value={contextValue}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error('useAuthSession must be used inside AuthSessionProvider.');
  }

  return context;
}

import type { ApiErrorResponse } from '@pulsechat/contracts';

import { loadPublicEnv } from '../config/public-env';

type ApiRequestMethod = 'GET' | 'POST';
type ApiRequestCredentials = 'include' | 'omit' | 'same-origin';

interface ApiRequestOptions {
  method?: ApiRequestMethod;
  body?: unknown;
  accessToken?: string;
  credentials?: ApiRequestCredentials;
}

const emptyResponseStatuses = new Set([204, 205]);

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: ApiErrorResponse['details'];

  constructor(status: number, response: ApiErrorResponse) {
    super(response.message);

    this.name = 'ApiClientError';
    this.status = status;
    this.code = response.code;
    this.details = response.details;
  }
}

function createFallbackError(status: number): ApiErrorResponse {
  return {
    code: 'request_failed',
    message:
      status >= 500
        ? 'The server is temporarily unavailable.'
        : 'The request could not be completed.',
  };
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const env = loadPublicEnv();
  const headers: Record<string, string> = {};

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const requestInit: NonNullable<Parameters<typeof globalThis.fetch>[1]> = {
    method: options.method ?? 'GET',
    credentials: options.credentials ?? 'same-origin',
    cache: 'no-store',
    headers,
  };

  if (options.body) {
    requestInit.body = JSON.stringify(options.body);
  }

  const response = await globalThis.fetch(`${env.apiBaseUrl}${path}`, requestInit);

  if (emptyResponseStatuses.has(response.status)) {
    return undefined as TResponse;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? ((await response.json()) as TResponse | ApiErrorResponse)
    : null;

  if (!response.ok) {
    throw new ApiClientError(
      response.status,
      payload && typeof payload === 'object' && 'code' in payload && 'message' in payload
        ? (payload as ApiErrorResponse)
        : createFallbackError(response.status),
    );
  }

  return payload as TResponse;
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong while talking to the API.';
}

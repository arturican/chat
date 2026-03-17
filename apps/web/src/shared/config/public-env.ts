export interface PublicEnv {
  apiBaseUrl: string;
}

const defaultApiBaseUrl = 'http://localhost:4000/api';

function readRequiredUrl(
  env: Record<string, string | undefined>,
  key: 'NEXT_PUBLIC_API_BASE_URL',
): string {
  const value = env[key] ?? defaultApiBaseUrl;

  new globalThis.URL(value);

  return value;
}

export function loadPublicEnv(
  env: Record<string, string | undefined> = globalThis.process.env,
): PublicEnv {
  return {
    apiBaseUrl: readRequiredUrl(env, 'NEXT_PUBLIC_API_BASE_URL'),
  };
}

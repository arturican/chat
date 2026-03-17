export interface AppConfig {
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: string;
  refreshTokenTtl: string;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  appOrigin: string;
  apiPort: number;
}

type Environment = Record<string, string | undefined>;

type AppConfigMap = {
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_TTL: string;
  REFRESH_TOKEN_TTL: string;
  S3_ENDPOINT: string;
  S3_REGION: string;
  S3_BUCKET: string;
  S3_ACCESS_KEY_ID: string;
  S3_SECRET_ACCESS_KEY: string;
  APP_ORIGIN: string;
  API_PORT: string;
};

function readRequiredString(env: Environment, key: keyof AppConfigMap): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }

  return value;
}

function readUrl(env: Environment, key: keyof AppConfigMap): string {
  const value = readRequiredString(env, key);
  new globalThis.URL(value);

  return value;
}

function readPort(env: Environment, key: keyof AppConfigMap): number {
  const value = Number(readRequiredString(env, key));

  if (!Number.isInteger(value) || value <= 0 || value > 65535) {
    throw new Error(`Invalid port for env variable: ${key}`);
  }

  return value;
}

export function loadAppConfig(env: Environment): AppConfig {
  return {
    databaseUrl: readUrl(env, 'DATABASE_URL'),
    jwtAccessSecret: readRequiredString(env, 'JWT_ACCESS_SECRET'),
    jwtRefreshSecret: readRequiredString(env, 'JWT_REFRESH_SECRET'),
    accessTokenTtl: readRequiredString(env, 'ACCESS_TOKEN_TTL'),
    refreshTokenTtl: readRequiredString(env, 'REFRESH_TOKEN_TTL'),
    s3Endpoint: readUrl(env, 'S3_ENDPOINT'),
    s3Region: readRequiredString(env, 'S3_REGION'),
    s3Bucket: readRequiredString(env, 'S3_BUCKET'),
    s3AccessKeyId: readRequiredString(env, 'S3_ACCESS_KEY_ID'),
    s3SecretAccessKey: readRequiredString(env, 'S3_SECRET_ACCESS_KEY'),
    appOrigin: readUrl(env, 'APP_ORIGIN'),
    apiPort: readPort(env, 'API_PORT'),
  };
}

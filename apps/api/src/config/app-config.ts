export type DurationString = `${number}${'s' | 'm' | 'h' | 'd'}`;

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  databaseUrl: string;
  jwtAccessSecret: string;
  jwtRefreshSecret: string;
  accessTokenTtl: DurationString;
  accessTokenTtlMs: number;
  refreshTokenTtl: DurationString;
  refreshTokenTtlMs: number;
  s3Endpoint: string;
  s3Region: string;
  s3Bucket: string;
  s3AccessKeyId: string;
  s3SecretAccessKey: string;
  appOrigin: string;
  apiPort: number;
}

type Environment = Record<string, string | undefined>;

const durationPattern = /^(?<value>\d+)(?<unit>[smhd])$/;

type AppConfigMap = {
  NODE_ENV: string;
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

type NodeEnvironment = AppConfig['nodeEnv'];

function readRequiredString(env: Environment, key: keyof AppConfigMap): string {
  const value = env[key];

  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }

  return value;
}

function readNodeEnv(env: Environment): NodeEnvironment {
  const value = env.NODE_ENV ?? 'development';

  if (value !== 'development' && value !== 'test' && value !== 'production') {
    throw new Error('Invalid NODE_ENV. Expected development, test, or production.');
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

function readDuration(
  env: Environment,
  key: 'ACCESS_TOKEN_TTL' | 'REFRESH_TOKEN_TTL',
): DurationString {
  const value = readRequiredString(env, key);

  if (!durationPattern.test(value)) {
    throw new Error(
      `Invalid duration value for ${key}: "${value}". Expected a number followed by s, m, h, or d.`,
    );
  }

  return value as DurationString;
}

export function durationToMilliseconds(duration: DurationString): number {
  const match = duration.match(durationPattern);

  if (!match?.groups) {
    throw new Error(
      `Invalid duration value "${duration}". Expected a number followed by s, m, h, or d.`,
    );
  }

  const value = Number(match.groups.value);
  const unit = match.groups.unit as 's' | 'm' | 'h' | 'd';
  const multiplierByUnit: Record<'s' | 'm' | 'h' | 'd', number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return value * multiplierByUnit[unit];
}

export function loadAppConfig(env: Environment): AppConfig {
  const accessTokenTtl = readDuration(env, 'ACCESS_TOKEN_TTL');
  const refreshTokenTtl = readDuration(env, 'REFRESH_TOKEN_TTL');

  return {
    nodeEnv: readNodeEnv(env),
    databaseUrl: readUrl(env, 'DATABASE_URL'),
    jwtAccessSecret: readRequiredString(env, 'JWT_ACCESS_SECRET'),
    jwtRefreshSecret: readRequiredString(env, 'JWT_REFRESH_SECRET'),
    accessTokenTtl,
    accessTokenTtlMs: durationToMilliseconds(accessTokenTtl),
    refreshTokenTtl,
    refreshTokenTtlMs: durationToMilliseconds(refreshTokenTtl),
    s3Endpoint: readUrl(env, 'S3_ENDPOINT'),
    s3Region: readRequiredString(env, 'S3_REGION'),
    s3Bucket: readRequiredString(env, 'S3_BUCKET'),
    s3AccessKeyId: readRequiredString(env, 'S3_ACCESS_KEY_ID'),
    s3SecretAccessKey: readRequiredString(env, 'S3_SECRET_ACCESS_KEY'),
    appOrigin: readUrl(env, 'APP_ORIGIN'),
    apiPort: readPort(env, 'API_PORT'),
  };
}

import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { MeResponse } from '@pulsechat/contracts';
import request from 'supertest';

import { configureApp } from '../src/app.factory';
import { AppModule } from '../src/app.module';
import { loadAppConfig } from '../src/config/app-config';
import { PrismaService } from '../src/prisma/prisma.service';

const defaultEnvironment = {
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/pulsechat',
  JWT_ACCESS_SECRET: 'change-me-access-secret',
  JWT_REFRESH_SECRET: 'change-me-refresh-secret',
  ACCESS_TOKEN_TTL: '15m',
  REFRESH_TOKEN_TTL: '30d',
  S3_ENDPOINT: 'http://localhost:9000',
  S3_REGION: 'us-east-1',
  S3_BUCKET: 'pulsechat',
  S3_ACCESS_KEY_ID: 'minioadmin',
  S3_SECRET_ACCESS_KEY: 'minioadmin',
  APP_ORIGIN: 'http://localhost:3000',
  API_PORT: '4000',
} as const;

function ensureTestEnvironment() {
  for (const [key, value] of Object.entries(defaultEnvironment)) {
    globalThis.process.env[key] ??= value;
  }

  globalThis.process.env.NODE_ENV = 'test';
}

function getCookie(response: request.Response): string {
  const rawCookieHeader = response.headers['set-cookie'];
  const [cookie] = Array.isArray(rawCookieHeader) ? rawCookieHeader : [];

  if (!cookie) {
    throw new Error('Expected a refresh cookie to be set.');
  }

  return cookie.split(';')[0];
}

describe('AuthController', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ensureTestEnvironment();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await configureApp(app, loadAppConfig(globalThis.process.env));
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "sessions", "profiles", "users" CASCADE;');
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers a user and returns auth payload with a refresh cookie', async () => {
    const response = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'TeSt@example.com',
      password: 'supersecret1',
      username: 'Tester_User',
    });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.user.username).toBe('tester_user');
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([expect.stringContaining('pulsechat_refresh_token=')]),
    );
  });

  it('rejects invalid login credentials', async () => {
    await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'user@example.com',
      password: 'supersecret1',
      username: 'user_one',
    });

    const response = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'user@example.com',
      password: 'wrongpass1',
    });

    expect(response.status).toBe(401);
    expect(response.body.code).toBe('invalid_credentials');
  });

  it('rotates refresh tokens and rejects reuse of the old cookie', async () => {
    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'rotate@example.com',
      password: 'supersecret1',
      username: 'rotate_user',
    });
    const initialCookie = getCookie(registerResponse);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialCookie)
      .send();
    const rotatedCookie = getCookie(refreshResponse);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toEqual(expect.any(String));
    expect(rotatedCookie).not.toBe(initialCookie);

    const reusedResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', initialCookie)
      .send();

    expect(reusedResponse.status).toBe(401);
    expect(reusedResponse.body.code).toBe('invalid_refresh_token');
  });

  it('revokes the session on logout', async () => {
    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'logout@example.com',
      password: 'supersecret1',
      username: 'logout_user',
    });
    const refreshCookie = getCookie(registerResponse);

    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set('Cookie', refreshCookie)
      .send();

    expect(logoutResponse.status).toBe(204);

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', refreshCookie)
      .send();

    expect(refreshResponse.status).toBe(401);
    expect(refreshResponse.body.code).toBe('invalid_refresh_token');
  });

  it('protects /api/me and returns the current user for a valid bearer token', async () => {
    const unauthorizedResponse = await request(app.getHttpServer()).get('/api/me');

    expect(unauthorizedResponse.status).toBe(401);
    expect(unauthorizedResponse.body.code).toBe('unauthorized');

    const registerResponse = await request(app.getHttpServer()).post('/api/auth/register').send({
      email: 'me@example.com',
      password: 'supersecret1',
      username: 'me_user',
    });

    const meResponse = await request(app.getHttpServer())
      .get('/api/me')
      .set('Authorization', `Bearer ${registerResponse.body.accessToken}`)
      .send();

    const responseBody = meResponse.body as MeResponse;

    expect(meResponse.status).toBe(200);
    expect(responseBody.user.email).toBe('me@example.com');
    expect(responseBody.user.username).toBe('me_user');
  });
});

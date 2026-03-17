import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
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

async function registerUser(
  app: NestFastifyApplication,
  payload: { email: string; username: string; password?: string },
) {
  const response = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: payload.email,
      username: payload.username,
      password: payload.password ?? 'supersecret1',
    });

  return {
    accessToken: response.body.accessToken as string,
    user: response.body.user as { id: string; username: string; email: string },
  };
}

describe('ChatsController', () => {
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
    await prisma.$executeRawUnsafe(
      'TRUNCATE TABLE "chat_members", "chats", "sessions", "profiles", "users" CASCADE;',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates a direct chat and reuses it on repeat requests', async () => {
    const alice = await registerUser(app, {
      email: 'alice@example.com',
      username: 'alice_user',
    });
    await registerUser(app, {
      email: 'bob@example.com',
      username: 'bob_user',
    });

    const firstResponse = await request(app.getHttpServer())
      .post('/api/chats/direct')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({
        username: 'bob_user',
      });

    const secondResponse = await request(app.getHttpServer())
      .post('/api/chats/direct')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({
        username: 'bob_user',
      });

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body.type).toBe('direct');
    expect(firstResponse.body.memberCount).toBe(2);
    expect(secondResponse.body.id).toBe(firstResponse.body.id);
  });

  it('creates a group chat and returns it in the chat list', async () => {
    const owner = await registerUser(app, {
      email: 'owner@example.com',
      username: 'owner_user',
    });
    await registerUser(app, {
      email: 'one@example.com',
      username: 'member_one',
    });
    await registerUser(app, {
      email: 'two@example.com',
      username: 'member_two',
    });

    const createResponse = await request(app.getHttpServer())
      .post('/api/chats/group')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        title: 'Launch Team',
        memberUsernames: ['member_one', 'member_two'],
      });

    const listResponse = await request(app.getHttpServer())
      .get('/api/chats')
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.type).toBe('group');
    expect(createResponse.body.title).toBe('Launch Team');
    expect(createResponse.body.memberCount).toBe(3);
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.chats).toHaveLength(1);
    expect(listResponse.body.chats[0].title).toBe('Launch Team');
  });

  it('returns chat details only to members', async () => {
    const owner = await registerUser(app, {
      email: 'owner2@example.com',
      username: 'owner_two',
    });
    await registerUser(app, {
      email: 'peer2@example.com',
      username: 'peer_two',
    });
    const outsider = await registerUser(app, {
      email: 'outsider@example.com',
      username: 'outsider_user',
    });

    const createResponse = await request(app.getHttpServer())
      .post('/api/chats/direct')
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        username: 'peer_two',
      });

    const memberResponse = await request(app.getHttpServer())
      .get(`/api/chats/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${owner.accessToken}`);
    const outsiderResponse = await request(app.getHttpServer())
      .get(`/api/chats/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);

    expect(memberResponse.status).toBe(200);
    expect(memberResponse.body.chat.id).toBe(createResponse.body.id);
    expect(outsiderResponse.status).toBe(404);
    expect(outsiderResponse.body.code).toBe('chat_not_found');
  });
});

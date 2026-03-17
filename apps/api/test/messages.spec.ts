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

async function createDirectChat(
  app: NestFastifyApplication,
  accessToken: string,
  username: string,
): Promise<string> {
  const response = await request(app.getHttpServer())
    .post('/api/chats/direct')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      username,
    });

  return response.body.id as string;
}

describe('MessagesController', () => {
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
      'TRUNCATE TABLE "messages", "chat_members", "chats", "sessions", "profiles", "users" CASCADE;',
    );
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates messages, supports replies, and paginates older history', async () => {
    const owner = await registerUser(app, {
      email: 'messages-owner@example.com',
      username: 'messages_owner',
    });
    await registerUser(app, {
      email: 'messages-peer@example.com',
      username: 'messages_peer',
    });

    const chatId = await createDirectChat(app, owner.accessToken, 'messages_peer');

    const firstMessage = await request(app.getHttpServer())
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'First note',
      });

    await request(app.getHttpServer())
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Second note',
      });

    const replyMessage = await request(app.getHttpServer())
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Replying to the first one',
        replyToMessageId: firstMessage.body.id,
      });

    const latestPage = await request(app.getHttpServer())
      .get(`/api/chats/${chatId}/messages`)
      .query({
        limit: 2,
      })
      .set('Authorization', `Bearer ${owner.accessToken}`);

    const olderPage = await request(app.getHttpServer())
      .get(`/api/chats/${chatId}/messages`)
      .query({
        limit: 2,
        cursor: latestPage.body.meta.nextCursor,
      })
      .set('Authorization', `Bearer ${owner.accessToken}`);

    expect(firstMessage.status).toBe(201);
    expect(replyMessage.status).toBe(201);
    expect(replyMessage.body.replyTo.id).toBe(firstMessage.body.id);
    expect(replyMessage.body.replyTo.body).toBe('First note');
    expect(latestPage.status).toBe(200);
    expect(latestPage.body.data).toHaveLength(2);
    expect(latestPage.body.data[0].body).toBe('Second note');
    expect(latestPage.body.data[1].body).toBe('Replying to the first one');
    expect(latestPage.body.meta.nextCursor).toBeTruthy();
    expect(olderPage.status).toBe(200);
    expect(olderPage.body.data).toHaveLength(1);
    expect(olderPage.body.data[0].body).toBe('First note');
    expect(olderPage.body.meta.nextCursor).toBeNull();
  });

  it('blocks non-members from reading or writing chat history', async () => {
    const owner = await registerUser(app, {
      email: 'messages-owner-2@example.com',
      username: 'messages_owner_two',
    });
    await registerUser(app, {
      email: 'messages-peer-2@example.com',
      username: 'messages_peer_two',
    });
    const outsider = await registerUser(app, {
      email: 'messages-outsider@example.com',
      username: 'messages_outsider',
    });

    const chatId = await createDirectChat(app, owner.accessToken, 'messages_peer_two');

    const readResponse = await request(app.getHttpServer())
      .get(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${outsider.accessToken}`);

    const writeResponse = await request(app.getHttpServer())
      .post(`/api/chats/${chatId}/messages`)
      .set('Authorization', `Bearer ${outsider.accessToken}`)
      .send({
        body: 'Trying to intrude',
      });

    expect(readResponse.status).toBe(404);
    expect(readResponse.body.code).toBe('chat_not_found');
    expect(writeResponse.status).toBe(404);
    expect(writeResponse.body.code).toBe('chat_not_found');
  });

  it('rejects reply targets that do not belong to the same chat', async () => {
    const owner = await registerUser(app, {
      email: 'messages-owner-3@example.com',
      username: 'messages_owner_three',
    });
    await registerUser(app, {
      email: 'messages-peer-3@example.com',
      username: 'messages_peer_three',
    });
    await registerUser(app, {
      email: 'messages-peer-4@example.com',
      username: 'messages_peer_four',
    });

    const firstChatId = await createDirectChat(app, owner.accessToken, 'messages_peer_three');
    const secondChatId = await createDirectChat(app, owner.accessToken, 'messages_peer_four');

    const originalMessage = await request(app.getHttpServer())
      .post(`/api/chats/${firstChatId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Original thread',
      });

    const replyResponse = await request(app.getHttpServer())
      .post(`/api/chats/${secondChatId}/messages`)
      .set('Authorization', `Bearer ${owner.accessToken}`)
      .send({
        body: 'Wrong reply target',
        replyToMessageId: originalMessage.body.id,
      });

    expect(replyResponse.status).toBe(404);
    expect(replyResponse.body.code).toBe('reply_message_not_found');
  });
});

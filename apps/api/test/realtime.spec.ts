import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import type { AnyServerEvent } from '@pulsechat/contracts';
import request from 'supertest';
import { WebSocket, type RawData } from 'ws';

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
  API_PORT: '4101',
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

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', (error: Error) => reject(error));
  });
}

function waitForEvent<TEvent extends AnyServerEvent['event']>(
  socket: WebSocket,
  eventName: TEvent,
): Promise<Extract<AnyServerEvent, { event: TEvent }>> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(`Timed out waiting for websocket event: ${eventName}`));
    }, 5000);

    const cleanup = () => {
      globalThis.clearTimeout(timer);
      socket.off('message', onMessage);
      socket.off('error', onError);
    };

    const onError = (error: Error) => {
      cleanup();
      reject(error);
    };

    const onMessage = (rawMessage: RawData) => {
      const message = JSON.parse(rawMessage.toString()) as AnyServerEvent;

      if (message.event !== eventName) {
        return;
      }

      cleanup();
      resolve(message as Extract<AnyServerEvent, { event: TEvent }>);
    };

    socket.on('message', onMessage);
    socket.once('error', onError);
  });
}

describe('RealtimeGateway', () => {
  let app: NestFastifyApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    ensureTestEnvironment();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await configureApp(app, loadAppConfig(globalThis.process.env));
    await app.listen(Number(defaultEnvironment.API_PORT), '127.0.0.1');
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

  it('authenticates websocket clients and broadcasts idempotent message.created events', async () => {
    const owner = await registerUser(app, {
      email: 'realtime-owner@example.com',
      username: 'realtime_owner',
    });
    const peer = await registerUser(app, {
      email: 'realtime-peer@example.com',
      username: 'realtime_peer',
    });

    const chatId = await createDirectChat(app, owner.accessToken, 'realtime_peer');
    const ownerSocket = new WebSocket(`ws://127.0.0.1:${defaultEnvironment.API_PORT}/ws`);
    const peerSocket = new WebSocket(`ws://127.0.0.1:${defaultEnvironment.API_PORT}/ws`);

    try {
      await Promise.all([waitForOpen(ownerSocket), waitForOpen(peerSocket)]);

      const ownerAckPromise = waitForEvent(ownerSocket, 'auth.ack');
      const peerAckPromise = waitForEvent(peerSocket, 'auth.ack');

      ownerSocket.send(
        JSON.stringify({
          event: 'auth.identify',
          payload: {
            accessToken: owner.accessToken,
          },
        }),
      );
      peerSocket.send(
        JSON.stringify({
          event: 'auth.identify',
          payload: {
            accessToken: peer.accessToken,
          },
        }),
      );

      await Promise.all([ownerAckPromise, peerAckPromise]);

      const ownerMessagePromise = waitForEvent(ownerSocket, 'message.created');
      const peerMessagePromise = waitForEvent(peerSocket, 'message.created');

      ownerSocket.send(
        JSON.stringify({
          event: 'message.send',
          payload: {
            chatId,
            clientId: 'client-message-1',
            body: 'Live hello',
            replyToMessageId: null,
          },
        }),
      );

      const [ownerEvent, peerEvent] = await Promise.all([ownerMessagePromise, peerMessagePromise]);

      const duplicateEventPromise = waitForEvent(ownerSocket, 'message.created');

      ownerSocket.send(
        JSON.stringify({
          event: 'message.send',
          payload: {
            chatId,
            clientId: 'client-message-1',
            body: 'Live hello',
            replyToMessageId: null,
          },
        }),
      );

      const duplicateEvent = await duplicateEventPromise;
      const storedMessages = await prisma.message.findMany({
        where: {
          chatId,
        },
      });

      expect(ownerEvent.payload.message.body).toBe('Live hello');
      expect(ownerEvent.payload.clientId).toBe('client-message-1');
      expect(peerEvent.payload.message.id).toBe(ownerEvent.payload.message.id);
      expect(duplicateEvent.payload.message.id).toBe(ownerEvent.payload.message.id);
      expect(storedMessages).toHaveLength(1);
      expect(storedMessages[0]?.clientId).toBe('client-message-1');
    } finally {
      ownerSocket.close();
      peerSocket.close();
    }
  });
});

import 'dotenv/config';

import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  await app.register(cookie);

  // На старте разрешаем простой dev CORS, чтобы позже фронтенд мог ходить в API.
  await app.register(cors, {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 3001);

  await app.listen(port, '0.0.0.0');

  console.log(`API listening on http://localhost:${port}`);
}

void bootstrap();

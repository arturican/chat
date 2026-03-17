import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppModule } from './app.module';
import { loadAppConfig } from './config/app-config';

async function bootstrap() {
  const config = loadAppConfig(globalThis.process.env);
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.appOrigin,
    credentials: true,
  });

  await app.listen(config.apiPort, '0.0.0.0');

  Logger.log(`API listening on http://0.0.0.0:${config.apiPort}/api`, 'Bootstrap');
}

void bootstrap();

import fastifyCookie from '@fastify/cookie';
import { ValidationPipe } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

import { AppException } from './common/exceptions/app-exception';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import type { AppConfig } from './config/app-config';

function formatValidationErrors(errors: ValidationError[]): Record<string, string> {
  const details: Record<string, string> = {};

  for (const error of errors) {
    const [firstConstraint] = Object.values(error.constraints ?? {});

    if (firstConstraint) {
      details[error.property] = firstConstraint;
    }
  }

  return details;
}

export async function configureApp(app: NestFastifyApplication, config: AppConfig) {
  await app.register(fastifyCookie);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: config.appOrigin,
    credentials: true,
  });
  app.useGlobalFilters(new ApiExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors) =>
        new AppException({
          status: 400,
          code: 'validation_error',
          message: 'Request validation failed.',
          details: formatValidationErrors(errors),
        }),
    }),
  );
}

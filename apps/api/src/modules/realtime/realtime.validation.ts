import type { Type } from '@nestjs/common';
import type { ValidationError } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { AppException } from '../../common/exceptions/app-exception';

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

export async function validateRealtimePayload<TInput extends object>(
  classType: Type<TInput>,
  payload: unknown,
): Promise<TInput> {
  const input = plainToInstance(classType, payload);
  const errors = await validate(input, {
    whitelist: true,
  });

  if (errors.length > 0) {
    throw new AppException({
      status: 400,
      code: 'validation_error',
      message: 'Event validation failed.',
      details: formatValidationErrors(errors),
    });
  }

  return input;
}

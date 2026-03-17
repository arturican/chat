import { HttpException } from '@nestjs/common';
import type { ApiErrorResponse } from '@pulsechat/contracts';

interface AppExceptionOptions {
  status: number;
  code: string;
  message: string;
  details?: ApiErrorResponse['details'];
}

export class AppException extends HttpException {
  readonly code: string;
  readonly details?: ApiErrorResponse['details'];

  constructor(options: AppExceptionOptions) {
    super(
      AppException.toResponseBody(options.code, options.message, options.details),
      options.status,
    );

    this.code = options.code;
    this.details = options.details;
  }

  private static toResponseBody(
    code: string,
    message: string,
    details?: ApiErrorResponse['details'],
  ): ApiErrorResponse {
    return details
      ? {
          code,
          message,
          details,
        }
      : {
          code,
          message,
        };
  }
}

import { Catch, HttpException, HttpStatus, type ExceptionFilter } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { ApiErrorResponse } from '@pulsechat/contracts';
import type { FastifyReply } from 'fastify';

import { AppException } from '../exceptions/app-exception';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<FastifyReply>();
    const { body, statusCode } = this.normalizeException(exception);

    response.status(statusCode).send(body);
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    body: ApiErrorResponse;
  } {
    if (exception instanceof AppException) {
      return {
        statusCode: exception.getStatus(),
        body: this.createBody(exception.code, exception.message, exception.details),
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const rawResponse = exception.getResponse();

      if (
        typeof rawResponse === 'object' &&
        rawResponse !== null &&
        'code' in rawResponse &&
        'message' in rawResponse
      ) {
        const typedResponse = rawResponse as ApiErrorResponse;

        return {
          statusCode,
          body: this.createBody(typedResponse.code, typedResponse.message, typedResponse.details),
        };
      }

      const message = Array.isArray((rawResponse as { message?: string[] }).message)
        ? (rawResponse as { message: string[] }).message.join(', ')
        : typeof rawResponse === 'string'
          ? rawResponse
          : exception.message;

      return {
        statusCode,
        body: {
          code: this.codeFromStatus(statusCode),
          message,
        },
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      body: {
        code: 'internal_error',
        message: 'An unexpected error occurred.',
      },
    };
  }

  private codeFromStatus(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
        return 'bad_request';
      case HttpStatus.UNAUTHORIZED:
        return 'unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'forbidden';
      case HttpStatus.NOT_FOUND:
        return 'not_found';
      case HttpStatus.CONFLICT:
        return 'conflict';
      default:
        return 'http_error';
    }
  }

  private createBody(
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

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';

import { HTTP_RETURN_CODE_KEY } from '../exceptions/http-return-code.decorator';
import { BusinessException } from '../exceptions/business.exception';
import { ResponseData } from '../response/response-data';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly reflector: Reflector,
  ) {}

  catch(exception: Error, host: ArgumentsHost): void {
    const httpStatus = this.determineHttpStatus(exception);
    const responseData = this.createResponseData(exception);

    this.logger.error(`Handling exception: ${exception.message}`, {
      exception: JSON.stringify(exception),
      status: httpStatus,
    });

    this.logger.error(exception.stack);

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    httpAdapter.reply(ctx.getResponse(), responseData, httpStatus);
  }

  private determineHttpStatus(exception: Error): HttpStatus {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof BusinessException) {
      return this.reflector.get<HttpStatus>(
        HTTP_RETURN_CODE_KEY,
        exception.constructor,
      );
    }

    return HttpStatus.BAD_REQUEST;
  }

  private createResponseData(exception: Error): ResponseData {
    if (exception instanceof HttpException) {
      const response = exception.getResponse() as
        | string
        | Record<string, unknown>;

      if (
        typeof response === 'object' &&
        response['message'] &&
        Array.isArray(response['message'])
      ) {
        const validationMessages = (response['message'] as string[]).join('; ');

        return ResponseData.builder()
          .unsuccessful()
          .withErrorMessage('Erro de validação dos dados fornecidos.')
          .withDetailedErrorMessage(validationMessages)
          .build();
      }

      const errorMessage =
        typeof response === 'string'
          ? response
          : (response['message'] as string) || exception.message;

      return ResponseData.builder()
        .unsuccessful()
        .withErrorMessage(errorMessage)
        .withDetailedErrorMessage(errorMessage)
        .build();
    }

    if (exception instanceof BusinessException) {
      return ResponseData.builder()
        .unsuccessful()
        .withErrorMessage(exception.message)
        .withDetailedErrorMessage(
          exception.detailedErrorMessage || exception.message,
        )
        .build();
    }

    return ResponseData.builder()
      .unsuccessful()
      .withErrorMessage('Ocorreu um erro inesperado no servidor.')
      .withDetailedErrorMessage(exception.message)
      .build();
  }
}

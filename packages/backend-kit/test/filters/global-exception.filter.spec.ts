import {
  ArgumentsHost,
  BadRequestException,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { HttpAdapterHost, Reflector } from '@nestjs/core';
import { GlobalExceptionFilter } from '../../src/filters/global-exception.filter';
import { BusinessException } from '../../src/exceptions/business.exception';
import {
  HttpReturnCode,
  HTTP_RETURN_CODE_KEY,
} from '../../src/exceptions/http-return-code.decorator';

@HttpReturnCode(HttpStatus.CONFLICT)
class DuplicateRecordException extends BusinessException {
  constructor() {
    super(
      'Registro duplicado',
      'DUPLICATE',
      'Já existe um registro com esses dados',
    );
  }
}

@HttpReturnCode(HttpStatus.UNPROCESSABLE_ENTITY)
class InvalidOperationException extends BusinessException {
  constructor(message: string) {
    super(message, 'INVALID_OPERATION');
  }
}

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let mockReply: jest.Mock;
  let mockGetResponse: jest.Mock;
  let mockHost: ArgumentsHost;
  let mockHttpAdapterHost: HttpAdapterHost;
  let reflector: Reflector;

  beforeEach(() => {
    mockReply = jest.fn();
    mockGetResponse = jest.fn().mockReturnValue({});

    mockHttpAdapterHost = {
      httpAdapter: {
        reply: mockReply,
      },
    } as unknown as HttpAdapterHost;

    mockHost = {
      switchToHttp: () => ({
        getResponse: mockGetResponse,
        getRequest: jest.fn().mockReturnValue({}),
      }),
    } as unknown as ArgumentsHost;

    reflector = new Reflector();
    filter = new GlobalExceptionFilter(mockHttpAdapterHost, reflector);
  });

  describe('HttpException handling', () => {
    it('should handle HttpException with status 404', () => {
      const exception = new NotFoundException('Resource not found');

      filter.catch(exception, mockHost);

      expect(mockReply).toHaveBeenCalledTimes(1);
      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.NOT_FOUND);
      expect(responseData.successful).toBe(false);
      expect(responseData.errorMessage).toBe('Resource not found');
    });

    it('should handle HttpException with string response', () => {
      const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

      filter.catch(exception, mockHost);

      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.FORBIDDEN);
      expect(responseData.successful).toBe(false);
      expect(responseData.errorMessage).toBe('Forbidden');
    });

    it('should handle validation errors with array of messages', () => {
      const exception = new BadRequestException({
        message: ['campo1 é obrigatório', 'campo2 é inválido'],
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, mockHost);

      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(responseData.successful).toBe(false);
      expect(responseData.errorMessage).toBe(
        'Erro de validação dos dados fornecidos.',
      );
      expect(responseData.detailedErrorMessage).toBe(
        'campo1 é obrigatório; campo2 é inválido',
      );
    });
  });

  describe('BusinessException handling', () => {
    it('should use @HttpReturnCode metadata to determine status', () => {
      const exception = new DuplicateRecordException();

      filter.catch(exception, mockHost);

      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.CONFLICT);
      expect(responseData.successful).toBe(false);
      expect(responseData.errorMessage).toBe('Registro duplicado');
      expect(responseData.detailedErrorMessage).toBe(
        'Já existe um registro com esses dados',
      );
    });

    it('should use message as detailedErrorMessage when not provided', () => {
      const exception = new InvalidOperationException('Operação não permitida');

      filter.catch(exception, mockHost);

      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(responseData.errorMessage).toBe('Operação não permitida');
      expect(responseData.detailedErrorMessage).toBe('Operação não permitida');
    });
  });

  describe('Generic Error handling', () => {
    it('should handle generic Error with status 400 and generic message', () => {
      const exception = new Error('unexpected internal bug');

      filter.catch(exception, mockHost);

      const [, responseData, status] = mockReply.mock.calls[0];
      expect(status).toBe(HttpStatus.BAD_REQUEST);
      expect(responseData.successful).toBe(false);
      expect(responseData.errorMessage).toBe(
        'Ocorreu um erro inesperado no servidor.',
      );
      expect(responseData.detailedErrorMessage).toBe('unexpected internal bug');
    });
  });

  describe('Logging', () => {
    it('should log exception with error level', () => {
      const loggerSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new Error('test error');

      filter.catch(exception, mockHost);

      expect(loggerSpy).toHaveBeenCalledTimes(2);
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('test error'),
        expect.any(Object),
      );
    });
  });
});

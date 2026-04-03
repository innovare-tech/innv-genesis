import { HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessException } from '../../src/exceptions/business.exception';
import {
  HttpReturnCode,
  HTTP_RETURN_CODE_KEY,
} from '../../src/exceptions/http-return-code.decorator';

@HttpReturnCode(HttpStatus.NOT_FOUND)
class NotFoundException extends BusinessException {
  constructor(message: string, detailedMessage?: string) {
    super(message, 'NOT_FOUND', detailedMessage);
  }
}

@HttpReturnCode(HttpStatus.CONFLICT)
class DuplicateException extends BusinessException {
  constructor() {
    super(
      'Registro duplicado',
      'DUPLICATE',
      'Já existe um registro com esses dados',
      'DB unique constraint violation',
    );
  }
}

describe('BusinessException', () => {
  it('should preserve errorMessage, code and detailedErrorMessage', () => {
    const exception = new NotFoundException(
      'Recurso não encontrado',
      'O ticket 123 não foi encontrado',
    );

    expect(exception.errorMessage).toBe('Recurso não encontrado');
    expect(exception.message).toBe('Recurso não encontrado');
    expect(exception.code).toBe('NOT_FOUND');
    expect(exception.detailedErrorMessage).toBe(
      'O ticket 123 não foi encontrado',
    );
  });

  it('should preserve logDetailedErrorMessage', () => {
    const exception = new DuplicateException();

    expect(exception.errorMessage).toBe('Registro duplicado');
    expect(exception.code).toBe('DUPLICATE');
    expect(exception.detailedErrorMessage).toBe(
      'Já existe um registro com esses dados',
    );
    expect(exception.logDetailedErrorMessage).toBe(
      'DB unique constraint violation',
    );
  });

  it('should allow optional detailedErrorMessage and logDetailedErrorMessage', () => {
    const exception = new NotFoundException('Não encontrado');

    expect(exception.detailedErrorMessage).toBeUndefined();
    expect(exception.logDetailedErrorMessage).toBeUndefined();
  });

  it('should be an instance of Error', () => {
    const exception = new NotFoundException('test');

    expect(exception).toBeInstanceOf(Error);
    expect(exception).toBeInstanceOf(BusinessException);
  });
});

describe('@HttpReturnCode', () => {
  it('should set HttpStatus.NOT_FOUND metadata on NotFoundException', () => {
    const reflector = new Reflector();
    const status = reflector.get<HttpStatus>(
      HTTP_RETURN_CODE_KEY,
      NotFoundException,
    );

    expect(status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should set HttpStatus.CONFLICT metadata on DuplicateException', () => {
    const reflector = new Reflector();
    const status = reflector.get<HttpStatus>(
      HTTP_RETURN_CODE_KEY,
      DuplicateException,
    );

    expect(status).toBe(HttpStatus.CONFLICT);
  });
});

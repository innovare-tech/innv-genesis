import 'reflect-metadata';
import { ErrorResponse, API_ERROR_META_KEY, ApiErrorMeta } from '../../src';

class NotFoundErrorDto {}
class ValidationErrorDto {}
class ServerErrorDto {}

describe('@ErrorResponse Decorator', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should define metadata correctly for a single error response', () => {
    class TestController {
      @ErrorResponse(404, NotFoundErrorDto)
      public testMethod() {}
    }
    const instance = new TestController();

    const savedMeta = Reflect.getMetadata(
      API_ERROR_META_KEY,
      instance,
      'testMethod',
    );
    const expectedMap: ApiErrorMeta = new Map();
    expectedMap.set(404, NotFoundErrorDto);

    expect(savedMeta).toBeDefined();
    expect(savedMeta).toEqual(expectedMap);
  });

  it('should accumulate metadata correctly for multiple different error responses', () => {
    class TestController {
      @ErrorResponse(404, NotFoundErrorDto)
      @ErrorResponse(400, ValidationErrorDto)
      public testMethod() {}
    }
    const instance = new TestController();

    const savedMeta = Reflect.getMetadata(
      API_ERROR_META_KEY,
      instance,
      'testMethod',
    );
    const expectedMapFinal: ApiErrorMeta = new Map();
    expectedMapFinal.set(404, NotFoundErrorDto);
    expectedMapFinal.set(400, ValidationErrorDto);

    expect(savedMeta).toBeDefined();
    expect(savedMeta.size).toBe(2);
    expect(savedMeta.get(404)).toBe(NotFoundErrorDto);
    expect(savedMeta.get(400)).toBe(ValidationErrorDto);
    expect(savedMeta).toEqual(expectedMapFinal);
  });

  it('should keep the first decorator applied if the same status code is used multiple times', () => {
    class TestController {
      // A ordem parece ser relevante, e o primeiro aplicado pode estar prevalecendo
      @ErrorResponse(400, ValidationErrorDto) // Decorator A (Aplicado primeiro na leitura?)
      @ErrorResponse(400, ServerErrorDto) // Decorator B (Aplicado depois?)
      public testMethod() {}
    }
    const instance = new TestController();

    const savedMeta = Reflect.getMetadata(
      API_ERROR_META_KEY,
      instance,
      'testMethod',
    );
    const expectedMapFinal: ApiErrorMeta = new Map();
    // Ajustamos a expectativa para o PRIMEIRO DTO definido
    expectedMapFinal.set(400, ValidationErrorDto);

    expect(savedMeta).toBeDefined();
    expect(savedMeta.size).toBe(1);
    expect(savedMeta.get(400)).toBe(ValidationErrorDto);
    expect(savedMeta).toEqual(expectedMapFinal);
  });
});

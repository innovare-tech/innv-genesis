// packages/nexus/test/decorators/http-method.decorator.spec.ts
import 'reflect-metadata';
import {
  Get,
  Post,
  Put,
  Patch,
  Delete,
  API_METHOD_META_KEY,
  ApiMethodMeta,
} from '../../src';

// Mock do Reflect para espionar as chamadas
const defineMetadataSpy = jest.spyOn(Reflect, 'defineMetadata');

describe('HTTP Method Decorators', () => {
  beforeEach(() => {
    defineMetadataSpy.mockClear();
  });

  // Função helper para evitar repetição nos testes
  const testHttpMethod = (
    decorator: (path?: string) => MethodDecorator,
    methodName: ApiMethodMeta['method'],
    testPath: string,
  ) => {
    // Arrange: Cria uma classe com um método decorado
    class TestController {
      @decorator(testPath)
      public testMethod() {}
    }

    const instance = new TestController();

    // Assert: Verifica a chamada ao Reflect.defineMetadata
    expect(defineMetadataSpy).toHaveBeenCalledTimes(1);
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_METHOD_META_KEY, // A chave correta
      { method: methodName, path: testPath }, // Os metadados esperados
      instance,
      'testMethod',
    );

    // Opcional: Verifica se os metadados foram realmente salvos
    const savedMeta = Reflect.getMetadata(
      API_METHOD_META_KEY,
      instance,
      'testMethod',
    );
    expect(savedMeta).toEqual({ method: methodName, path: testPath });
  };

  it('should define metadata correctly for @Get', () => {
    testHttpMethod(Get, 'GET', '/users');
  });

  it('should define metadata correctly for @Post', () => {
    testHttpMethod(Post, 'POST', '/users');
  });

  it('should define metadata correctly for @Put', () => {
    testHttpMethod(Put, 'PUT', '/users/:id');
  });

  it('should define metadata correctly for @Patch', () => {
    testHttpMethod(Patch, 'PATCH', '/users/:id');
  });

  it('should define metadata correctly for @Delete', () => {
    testHttpMethod(Delete, 'DELETE', '/users/:id');
  });

  it('should handle empty path correctly (default to empty string)', () => {
    // Arrange
    class TestController {
      @Get() // Sem path explícito
      public testMethod() {}
    }
    const instance = new TestController();

    // Assert
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_METHOD_META_KEY,
      { method: 'GET', path: '' }, // Path deve ser ''
      instance,
      'testMethod',
    );
    const savedMeta = Reflect.getMetadata(
      API_METHOD_META_KEY,
      instance,
      'testMethod',
    );
    expect(savedMeta).toEqual({ method: 'GET', path: '' });
  });
});

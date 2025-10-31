// packages/nexus/test/decorators/param.decorator.spec.ts
import 'reflect-metadata';
import {
  Path,
  Query,
  Body,
  Header,
  API_PARAM_META_KEY,
  ApiParamMeta,
} from '../../src';

// Mock do Reflect para espionar as chamadas
const getMetadataSpy = jest.spyOn(Reflect, 'getMetadata');
const defineMetadataSpy = jest.spyOn(Reflect, 'defineMetadata');

describe('Parameter Decorators', () => {
  beforeEach(() => {
    // Limpa os spies
    getMetadataSpy.mockClear();
    defineMetadataSpy.mockClear();
    // Garante que a primeira chamada a getMetadata retorne undefined (simulando nenhum metadado pré-existente)
    getMetadataSpy.mockReturnValueOnce(undefined);
  });

  it('should define metadata correctly for @Path', () => {
    // Arrange: Classe com um método e um parâmetro @Path
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      public testMethod(@Path('id') userId: string) {}
    }

    // Act: A simples definição da classe já executa o decorator

    // Assert: Verifica se getMetadata foi chamado para buscar existentes
    expect(getMetadataSpy).toHaveBeenCalledWith(
      API_PARAM_META_KEY,
      TestController.prototype, // Alvo da classe
      'testMethod', // Nome do método
    );

    // Assert: Verifica se defineMetadata foi chamado para salvar o novo
    const expectedMeta: ApiParamMeta[] = [
      { index: 0, type: 'path', name: 'id' },
    ];
    expect(defineMetadataSpy).toHaveBeenCalledTimes(1);
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_PARAM_META_KEY, // A chave
      expectedMeta, // O array esperado com o parâmetro
      TestController.prototype, // Alvo da classe
      'testMethod', // Nome do método
    );
  });

  it('should define metadata correctly for @Query', () => {
    // Arrange
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      public testMethod(@Query('sort') sortBy: string) {}
    }
    // Act (implícito)
    // Assert
    const expectedMeta: ApiParamMeta[] = [
      { index: 0, type: 'query', name: 'sort' },
    ];
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_PARAM_META_KEY,
      expectedMeta,
      TestController.prototype,
      'testMethod',
    );
  });

  it('should define metadata correctly for @Body', () => {
    // Arrange
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      public testMethod(@Body() data: object) {}
    }
    // Act (implícito)
    // Assert
    const expectedMeta: ApiParamMeta[] = [
      { index: 0, type: 'body', name: undefined }, // Body não tem 'name'
    ];
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_PARAM_META_KEY,
      expectedMeta,
      TestController.prototype,
      'testMethod',
    );
  });

  it('should define metadata correctly for @Header', () => {
    // Arrange
    class TestController {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // @ts-ignore
      public testMethod(@Header('X-Api-Key') apiKey: string) {}
    }
    // Act (implícito)
    // Assert
    const expectedMeta: ApiParamMeta[] = [
      { index: 0, type: 'header', name: 'X-Api-Key' },
    ];
    expect(defineMetadataSpy).toHaveBeenCalledWith(
      API_PARAM_META_KEY,
      expectedMeta,
      TestController.prototype,
      'testMethod',
    );
  });

  it('should define metadata correctly for multiple parameters', () => {
    // Arrange: Define a classe com múltiplos parâmetros decorados
    class TestController {
      public testMethod(
        @Path('id') userId: string, // index 0
        @Query('limit') limit: number, // index 1
        @Body() bodyData: any, // index 2
      ) {
        return { userId, limit, bodyData };
      }
    }

    // Act: A definição da classe executa os decorators.

    // Assert: Verifica a *última* chamada ao defineMetadata.
    // Ela deve conter o array final com todos os parâmetros.
    expect(defineMetadataSpy).toHaveBeenCalledTimes(3); // Garante que todos rodaram

    // O array final pode estar em qualquer ordem, pois a ordem de execução
    // dos decorators pode variar ligeiramente. O importante é que todos
    // os itens estejam lá com os índices corretos.
    const finalMetadataCallArgs = defineMetadataSpy.mock.calls[2]; // Pega os args da última chamada
    const finalMetadataArray = finalMetadataCallArgs[1] as ApiParamMeta[];

    // Verifica se o array tem o tamanho certo
    expect(finalMetadataArray).toHaveLength(3);

    // Verifica se cada parâmetro esperado está presente no array final
    expect(finalMetadataArray).toEqual(
      expect.arrayContaining([
        expect.objectContaining<ApiParamMeta>({
          index: 0,
          type: 'path',
          name: 'id',
        }),
        expect.objectContaining<ApiParamMeta>({
          index: 1,
          type: 'query',
          name: 'limit',
        }),
        expect.objectContaining<ApiParamMeta>({
          index: 2,
          type: 'body',
          name: undefined,
        }),
      ]),
    );

    // Opcional: Verifica se os metadados finais foram salvos corretamente
    const savedMeta = Reflect.getMetadata(
      API_PARAM_META_KEY,
      TestController.prototype,
      'testMethod',
    );
    expect(savedMeta).toEqual(
      expect.arrayContaining([
        expect.objectContaining<ApiParamMeta>({
          index: 0,
          type: 'path',
          name: 'id',
        }),
        expect.objectContaining<ApiParamMeta>({
          index: 1,
          type: 'query',
          name: 'limit',
        }),
        expect.objectContaining<ApiParamMeta>({
          index: 2,
          type: 'body',
          name: undefined,
        }),
      ]),
    );
    expect(savedMeta).toHaveLength(3);
  });

  it('should throw error when used on constructor parameter', () => {
    // Arrange & Act & Assert
    expect(() => {
      class TestController {
        constructor(@Query('invalid') param: string) {
          console.log(param);
        }
      }
      // @ts-ignore
      new TestController(); // A instanciação força a execução do decorator
    }).toThrow(
      '@Query decorator não pode ser usado em parâmetros de construtor.',
    );
  });
});

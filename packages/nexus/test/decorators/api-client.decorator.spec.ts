// packages/nexus/test/decorators/api-client.decorator.spec.ts
import 'reflect-metadata'; // Necessário para ler/escrever metadados
import {
    ApiClient,
    ApiClientOptions,
    API_CLIENT_META_KEY,
} from '../../src';

// Mock do Reflect para espionar as chamadas
const defineMetadataSpy = jest.spyOn(Reflect, 'defineMetadata');

describe('@ApiClient Decorator', () => {
    // Limpa o spy antes de cada teste
    beforeEach(() => {
        defineMetadataSpy.mockClear();
    });

    it('should define metadata with the correct key and options (baseUrl)', () => {
        // Arrange: Define as opções e uma classe de teste
        const options: ApiClientOptions = {
            baseUrl: 'http://test.com',
            timeout: 5000,
            staticHeaders: { 'X-Test': 'true' },
        };

        // Act: Aplica o decorator
        @ApiClient(options)
        class TestClient {}

        // Assert: Verifica se Reflect.defineMetadata foi chamado corretamente
        expect(defineMetadataSpy).toHaveBeenCalledTimes(1);
        expect(defineMetadataSpy).toHaveBeenCalledWith(
            API_CLIENT_META_KEY, // A chave correta
            options, // As opções passadas
            TestClient, // A classe alvo
        );

        // Opcional: Verifica se os metadados foram realmente salvos
        const savedOptions = Reflect.getMetadata(API_CLIENT_META_KEY, TestClient);
        expect(savedOptions).toEqual(options);
    });

    it('should define metadata with the correct key and options (baseUrlEnvKey)', () => {
        // Arrange
        const options: ApiClientOptions = {
            baseUrlEnvKey: 'API_URL',
            timeoutEnvKey: 'API_TIMEOUT',
        };

        // Act
        @ApiClient(options)
        class AnotherTestClient {}

        // Assert
        expect(defineMetadataSpy).toHaveBeenCalledTimes(1);
        expect(defineMetadataSpy).toHaveBeenCalledWith(
            API_CLIENT_META_KEY,
            options,
            AnotherTestClient,
        );
        const savedOptions = Reflect.getMetadata(
            API_CLIENT_META_KEY,
            AnotherTestClient,
        );
        expect(savedOptions).toEqual(options);
    });

    it('should throw an error if neither baseUrl nor baseUrlEnvKey are provided', () => {
        // Arrange: Opções inválidas
        const invalidOptions: ApiClientOptions = {
            timeout: 1000,
        };

        // Act & Assert: Espera que a aplicação do decorator lance um erro
        expect(() => {
            @ApiClient(invalidOptions)
            class InvalidClient {}
            // A linha abaixo é só para evitar erro de 'unused class',
            // o teste real é a função expect(() => ...)
            new InvalidClient();
        }).toThrow(
            `[InvalidClient] deve prover 'baseUrl' ou 'baseUrlEnvKey' no @ApiClient`,
        );

        // Garante que o metadata *não* foi definido em caso de erro
        expect(defineMetadataSpy).not.toHaveBeenCalled();
    });
});
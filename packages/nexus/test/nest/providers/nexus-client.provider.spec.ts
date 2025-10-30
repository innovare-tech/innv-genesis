import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Provider } from '@nestjs/common';
import { AxiosError } from 'axios';
import 'reflect-metadata';
import {
    createNexusClientProvider,
    NexusValidationException,
} from '../../../src';
import {
    MockHardcodedApiClient,
    MockEnvApiClient,
} from '../helpers/mock-api.client';
import {
    MockValidationErrorDto,
    MockBodyDto,
} from '../helpers/mock-dtos';
import { NexusHttpService } from "../../../src/nest/nexus-http.service";

jest.mock('axios');
const mockHttpServiceRequest = jest.fn();

const mockHttpServiceProvider = {
    provide: NexusHttpService,
    useValue: { request: mockHttpServiceRequest },
};

const mockConfigServiceGet = jest.fn();
const mockConfigServiceProvider = {
    provide: ConfigService,
    useValue: { get: mockConfigServiceGet },
};

describe('createNexusClientProvider', () => {
    let moduleRef: TestingModule;
    let hardcodedApiClient: MockHardcodedApiClient;
    let envApiClient: MockEnvApiClient;

    const setupTestBed = async (clientClass: any, provider: Provider) => {
        moduleRef = await Test.createTestingModule({
            providers: [
                provider,
                mockHttpServiceProvider,
                mockConfigServiceProvider,
            ],
        }).compile();

        return moduleRef.get<any>(clientClass);
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        mockConfigServiceGet.mockImplementation((key: string) => {
            if (key === 'TEST_API_URL') return 'http://env.com/v1';
            if (key === 'TEST_API_TIMEOUT') return 3000;
            return undefined;
        });

        const hardcodedProvider = createNexusClientProvider(MockHardcodedApiClient);
        hardcodedApiClient = await setupTestBed(MockHardcodedApiClient, hardcodedProvider );

        const envProvider = createNexusClientProvider(MockEnvApiClient);
        envApiClient = await setupTestBed(MockEnvApiClient, envProvider);
    });

    afterEach(async () => {
        if (moduleRef) {
            await moduleRef.close();
        }
    });

    it('should create functional client proxies', () => {
        expect(hardcodedApiClient).toBeDefined();
        expect(typeof hardcodedApiClient.getItem).toBe('function');
        expect(typeof hardcodedApiClient.createItem).toBe('function');
        expect(typeof hardcodedApiClient.ping).toBe('function');
        expect(envApiClient).toBeDefined();
        expect(typeof envApiClient.getStatus).toBe('function');
    });

    describe('Request Assembly and Execution', () => {
        it('should call httpService.request with correctly assembled GET request (hardcoded config)', async () => {
            mockHttpServiceRequest.mockResolvedValue({ data: {}, status: 200, headers: {} });
            await hardcodedApiClient.getItem(123, true, 'tenant-abc');
            expect(mockHttpServiceRequest).toHaveBeenCalledTimes(1);
            expect(mockHttpServiceRequest).toHaveBeenCalledWith(
                expect.objectContaining({ baseUrl: 'http://hardcoded.com/api', timeout: 1000 }),
                expect.objectContaining({ method: 'GET', url: '/items/123?details=true', headers: { 'X-Static': 'StaticValue', 'X-Tenant-Id': 'tenant-abc' } }),
            );
        });

        it('should call httpService.request with correctly assembled POST request (hardcoded config)', async () => {
            mockHttpServiceRequest.mockResolvedValue({ data: {}, status: 201, headers: {} });
            const body: MockBodyDto = { description: 'New', value: 10 };
            await hardcodedApiClient.createItem(body);
            expect(mockHttpServiceRequest).toHaveBeenCalledTimes(1);
            expect(mockHttpServiceRequest).toHaveBeenCalledWith(
                expect.objectContaining({ baseUrl: 'http://hardcoded.com/api' }),
                expect.objectContaining({ method: 'POST', url: '/items', headers: { 'X-Static': 'StaticValue' }, data: body }),
            );
        });

        it('should call httpService.request using config from env variables', async () => {
            mockHttpServiceRequest.mockResolvedValue({ data: {}, status: 200, headers: {} });
            await envApiClient.getStatus();
            expect(mockConfigServiceGet).toHaveBeenCalledWith('TEST_API_URL');
            expect(mockConfigServiceGet).toHaveBeenCalledWith('TEST_API_TIMEOUT');
            expect(mockHttpServiceRequest).toHaveBeenCalledTimes(1);
            expect(mockHttpServiceRequest).toHaveBeenCalledWith(
                expect.objectContaining({ baseUrl: 'http://env.com/v1', timeout: 3000 }),
                expect.objectContaining({ method: 'GET', url: '/status', headers: {} }),
            );
        });

        it('should omit optional query/header params if undefined', async () => {
            mockHttpServiceRequest.mockResolvedValue({ data: {}, status: 200, headers: {} });
            await hardcodedApiClient.getItem(456);
            expect(mockHttpServiceRequest).toHaveBeenCalledTimes(1);
            expect(mockHttpServiceRequest).toHaveBeenCalledWith(
                expect.any(Object),
                expect.objectContaining({ method: 'GET', url: '/items/456', headers: { 'X-Static': 'StaticValue' } }),
            );
        });
    });

    describe('Response Handling', () => {
        it('should return Ok(data) on successful response', async () => {
            const responseData = { id: 1, name: 'Item Name' };
            mockHttpServiceRequest.mockResolvedValue({ data: responseData, status: 200, headers: {} });
            const result = await hardcodedApiClient.getItem(1);
            expect(result.isOk).toBe(true);
            if (result.isOk) { expect(result.status).toBe(200); expect(result.value).toEqual(responseData); }
        });

        it('should return Err(validatedData) for mapped error responses (@ErrorResponse)', async () => {
            const errorData = { code: 'VALIDATION_ERROR', fields: ['name', 'email'] };
            const mockAxiosErrorResponse = { data: errorData, status: 400, headers: {}, statusText: 'Bad Request', config: {} as any, request: {} };
            const axiosError = new Error('Bad Request') as AxiosError;
            axiosError.response = mockAxiosErrorResponse; axiosError.isAxiosError = true; axiosError.code = 'ERR_BAD_REQUEST';
            mockHttpServiceRequest.mockRejectedValue(axiosError);
            const result = await hardcodedApiClient.createItem({ description: '', value: -1 });
            expect(result.isOk).toBe(false);
            if (!result.isOk) {
                expect(result.status).toBe(400);
                expect(result.error).toBeInstanceOf(MockValidationErrorDto);
                expect(result.error).toEqual(expect.objectContaining({ code: 'VALIDATION_ERROR', fields: ['name', 'email'] }));
            }
        });

        it('should throw Nexus Contract Error if mapped error response body is invalid', async () => {
            const invalidErrorData = { code: 'VALIDATION_ERROR', fields: [], wrongField: 'abc' };
            const mockAxiosErrorResponse = { data: invalidErrorData, status: 400, headers: {}, statusText: 'Bad Request', config: {} as any, request: {} };
            const axiosError = new Error('Bad Request') as AxiosError;
            axiosError.response = mockAxiosErrorResponse; axiosError.isAxiosError = true; axiosError.code = 'ERR_BAD_REQUEST';
            mockHttpServiceRequest.mockRejectedValue(axiosError);

            // Agora checamos o tipo E a mensagem correta (que vem do validation.helper)
            // em uma única chamada.
            await expect(
                hardcodedApiClient.createItem({ description: 'test', value: 1 })
            ).rejects.toThrow(NexusValidationException);

            await expect(
                hardcodedApiClient.createItem({ description: 'test', value: 1 })
            ).rejects.toThrow(
                // 2. A MENSAGEM está correta (observe a regex):
                /\[Nexus Validation Error].*falhou na validação.*property wrongField should not exist/
            );
        });

        it('should re-throw error for unmapped error statuses', async () => {
            const errorData = { message: 'Internal Server Error' };
            const mockAxiosErrorResponse = { data: errorData, status: 500, headers: {}, statusText: 'Server Error', config: {} as any, request: {} };
            const axiosError = new Error('Server Error') as AxiosError;
            axiosError.response = mockAxiosErrorResponse; axiosError.isAxiosError = true; axiosError.code = 'ERR_INTERNAL_SERVER_ERROR';
            mockHttpServiceRequest.mockRejectedValue(axiosError);
            await expect(hardcodedApiClient.getItem(1)).rejects.toThrow('[Nexus] Erro não tratado em MockHardcodedApiClient.getItem: Server Error');
        });

        it('should re-throw error for network/timeout errors', async () => {
            const axiosError = new Error('Network Error') as AxiosError;
            axiosError.response = undefined; axiosError.isAxiosError = true; axiosError.code = 'ENOTFOUND';
            mockHttpServiceRequest.mockRejectedValue(axiosError);
            await expect(hardcodedApiClient.getItem(1)).rejects.toThrow('[Nexus] Erro não tratado em MockHardcodedApiClient.getItem: Network Error');
        });
    });

    describe('Configuration Resolution Errors', () => {
        it('should throw if baseUrlEnvKey is used but ConfigService is missing', async () => {
            const provider = createNexusClientProvider(MockEnvApiClient);
            await expect(async () => {
                moduleRef = await Test.createTestingModule({
                    providers: [
                        provider,
                        mockHttpServiceProvider
                    ],
                }).compile();
                moduleRef.get(MockEnvApiClient);
            }).rejects.toThrow(
                "[Nexus] MockEnvApiClient usa 'baseUrlEnvKey' mas ConfigService não está disponível."
            );
        });

        it('should throw if baseUrl cannot be resolved (missing env var)', async () => {
            mockConfigServiceGet.mockReturnValue(undefined);
            const provider = createNexusClientProvider(MockEnvApiClient);
            await expect(async () => {
                moduleRef = await Test.createTestingModule({
                    providers: [
                        provider,
                        mockHttpServiceProvider,
                        mockConfigServiceProvider
                    ],
                }).compile();
                moduleRef.get(MockEnvApiClient);
            }).rejects.toThrow(
                "[Nexus] MockEnvApiClient não conseguiu resolver a 'baseUrl'."
            );
        });
    });

});
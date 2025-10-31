import axios, { AxiosError, AxiosResponse } from 'axios'; // Removido AxiosHeaders
import { Test, TestingModule } from '@nestjs/testing';
import {
  NexusHttpService,
  NexusHttpResponse,
  NexusHttpError,
} from '../../src/nest/nexus-http.service';
import { ApiClientOptions } from '../../src';

// Mock do Axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockRequest = jest.fn();

// Define o mock de isAxiosError de forma mais simples
const mockIsAxiosError = jest.fn((payload: any): payload is AxiosError => {
  // Simula a verificação real: checa se tem a propriedade isAxiosError
  // E opcionalmente outras chaves comuns para robustez
  return (
    typeof payload === 'object' &&
    payload !== null &&
    payload.isAxiosError === true
  );
});
// Atribui o mock à propriedade correta, com type assertion se necessário
// @ts-ignore
(mockedAxios.isAxiosError as jest.Mock) = mockIsAxiosError;

mockedAxios.create.mockReturnValue({ request: mockRequest } as any);

// Função helper revisada
const createMockAxiosError = (
  message: string,
  code?: string,
  response?: Partial<AxiosResponse>,
): Partial<AxiosError> => {
  const error: Partial<AxiosError> = new Error(message);
  error.isAxiosError = true;
  error.code = code;
  error.response = response as AxiosResponse | undefined;
  // Adiciona um config mínimo para satisfazer tipos, incluindo headers
  error.config = { headers: {} as any } as any;
  error.request = {}; // Mínimo para satisfazer tipos
  return error;
};

describe('NexusHttpService', () => {
  let service: NexusHttpService;

  const mockClientOptions: ApiClientOptions = {
    baseUrl: 'http://base.url',
    timeout: 5000,
  };

  const mockRequestConfig = {
    method: 'GET',
    url: '/test',
    headers: { 'X-Test': 'true' },
    data: { key: 'value' },
  };

  beforeEach(async () => {
    mockRequest.mockClear();
    mockedAxios.create.mockClear();
    mockIsAxiosError.mockClear();
    // Reset da implementação default para cada teste
    mockIsAxiosError.mockImplementation(
      (payload: any): payload is AxiosError => {
        return (
          typeof payload === 'object' &&
          payload !== null &&
          payload.isAxiosError === true
        );
      },
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [NexusHttpService],
    }).compile();

    service = module.get<NexusHttpService>(NexusHttpService);
    expect(mockedAxios.create).toHaveBeenCalledTimes(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('request method', () => {
    it('should call axios.request with correct parameters', async () => {
      const mockAxiosResponse = {
        data: { id: 1, name: 'Test' },
        status: 200,
        headers: { 'content-type': 'application/json' },
      };
      mockRequest.mockResolvedValue(mockAxiosResponse);
      await service.request(mockClientOptions, mockRequestConfig);
      expect(mockRequest).toHaveBeenCalledTimes(1);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: mockClientOptions.baseUrl,
          url: mockRequestConfig.url,
          method: mockRequestConfig.method,
        }),
      );
    });

    it('should return NexusHttpResponse on successful request (2xx)', async () => {
      const responseData = { id: 1 };
      const mockAxiosResponse = {
        data: responseData,
        status: 201,
        headers: { location: '/users/1' },
      };
      mockRequest.mockResolvedValue(mockAxiosResponse);
      const result = await service.request<typeof responseData>(
        mockClientOptions,
        mockRequestConfig,
      );
      const expectedResponse: NexusHttpResponse<typeof responseData> = {
        data: responseData,
        status: 201,
        headers: { location: '/users/1' },
      };
      expect(result).toEqual(expectedResponse);
    });

    it('should throw NexusHttpError with response on API error (4xx/5xx)', async () => {
      const errorData = { code: 'NOT_FOUND', message: 'User not found' };
      const mockAxiosErrorResponse = {
        data: errorData,
        status: 404,
        headers: { 'content-type': 'application/json' },
        statusText: 'Not Found',
        config: {} as any,
        request: {},
      };
      const axiosError = createMockAxiosError(
        'Request failed with status code 404',
        'ERR_BAD_REQUEST',
        mockAxiosErrorResponse,
      );
      mockRequest.mockRejectedValue(axiosError);

      await expect(
        service.request<any, typeof errorData>(
          mockClientOptions,
          mockRequestConfig,
        ),
      ).rejects.toEqual<NexusHttpError<typeof errorData>>({
        response: {
          data: errorData,
          status: 404,
          headers: { 'content-type': 'application/json' },
        },
        message: 'Request failed with status code 404',
        isAxiosError: true,
        code: 'ERR_BAD_REQUEST',
      });
      expect(mockIsAxiosError).toHaveBeenCalledWith(axiosError);
    });

    it('should throw NexusHttpError without response on network/timeout error', async () => {
      const axiosError = createMockAxiosError(
        'timeout of 5000ms exceeded',
        'ECONNABORTED',
        undefined,
      );
      mockRequest.mockRejectedValue(axiosError);

      await expect(
        service.request(mockClientOptions, mockRequestConfig),
      ).rejects.toEqual<NexusHttpError>({
        response: undefined,
        message: 'timeout of 5000ms exceeded',
        isAxiosError: true,
        code: 'ECONNABORTED',
      });
      expect(mockIsAxiosError).toHaveBeenCalledWith(axiosError);
    });

    it('should throw NexusHttpError with isAxiosError=false and code for non-axios errors', async () => {
      const genericError = new Error('Something unexpected happened');
      mockRequest.mockRejectedValue(genericError);

      // Garante que isAxiosError retorne false para este erro específico
      mockIsAxiosError.mockImplementation(
        (payload: any): payload is AxiosError =>
          payload === genericError
            ? false
            : typeof payload === 'object' &&
              payload !== null &&
              payload.isAxiosError === true,
      );

      await expect(
        service.request(mockClientOptions, mockRequestConfig),
      ).rejects.toEqual<NexusHttpError>({
        response: undefined,
        message: 'Something unexpected happened',
        isAxiosError: false,
        code: 'NEXUS_INTERNAL_ERROR',
      });
      expect(mockIsAxiosError).toHaveBeenCalledWith(genericError);
    });
  });
});

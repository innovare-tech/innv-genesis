import { Injectable, OnModuleInit } from '@nestjs/common';
import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { ApiClientOptions } from '../decorators/api-client.decorator';

/**
 * Interface para a resposta HTTP crua, simplificada.
 */
export interface NexusHttpResponse<T = any> {
    data: T;
    status: number;
    headers: Record<string, string>;
}

export interface NexusHttpError<E = any> {
    response?: NexusHttpResponse<E>;
    message: string;
    isAxiosError: boolean;
    code?: string;
}

/**
 * @internal
 * Este serviço é um wrapper interno sobre o Axios.
 * Ele não deve ser usado diretamente pelo usuário da lib.
 * O Proxy gerado pelo Nexus o utilizará.
 */
@Injectable()
export class NexusHttpService implements OnModuleInit {
    private client: AxiosInstance;

    constructor() {
        // O cliente é inicializado sem config base.
        // O Proxy fornecerá a config a cada chamada.
        this.client = axios.create();
    }

    onModuleInit() {
        // (Opcional) Podemos configurar interceptors globais do axios aqui
        // por exemplo, para logging, se quisermos.
    }

    /**
     * Executa uma requisição HTTP.
     * Agora usando async/await.
     */
    public async request<T = any, E = any>(
        clientOptions: ApiClientOptions,
        requestConfig: {
            method: string;
            url: string;
            headers?: Record<string, string>;
            data?: any;
        },
    ): Promise<NexusHttpResponse<T>> { // A assinatura de retorno é a mesma
        const { baseUrl, timeout } = clientOptions;
        const { method, url, headers, data } = requestConfig;

        try {
            const response: AxiosResponse<T> = await this.client.request<T>({
                baseURL: baseUrl,
                url: url,
                method: method,
                headers: headers,
                data: data,
                timeout: timeout,
            });

            // Caminho de Sucesso (2xx)
            return {
                data: response.data,
                status: response.status,
                headers: response.headers as Record<string, string>,
            };
        } catch (error) {
            // Caminho de Erro (4xx, 5xx, timeout, rede)
            if (axios.isAxiosError(error)) {
                const axiosError = error as AxiosError<E>;

                // Se a API respondeu com um erro (4xx/5xx)
                if (axiosError.response) {
                    const errResponse: NexusHttpResponse<E> = {
                        data: axiosError.response.data,
                        status: axiosError.response.status,
                        headers: axiosError.response.headers as Record<string, string>,
                    };

                    throw {
                        response: errResponse,
                        message: axiosError.message,
                        isAxiosError: true,
                        code: axiosError.code,
                    } as NexusHttpError<E>;
                }

                // Se foi um erro de rede, timeout, ou config
                throw {
                    response: undefined,
                    message: axiosError.message,
                    isAxiosError: true,
                    code: axiosError.code, // Ex: 'ECONNABORTED' para timeout
                } as NexusHttpError<E>;
            }

            // Erro inesperado (não-Axios)
            throw {
                response: undefined,
                message: (error as Error).message || 'Unknown error',
                isAxiosError: false,
            } as NexusHttpError<E>;
        }
    }
}
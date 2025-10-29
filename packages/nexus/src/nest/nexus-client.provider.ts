import { Provider, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import 'reflect-metadata';
import {
    API_CLIENT_META_KEY,
    ApiClientOptions,
} from '../decorators/api-client.decorator';
import {
    API_ERROR_META_KEY,
    ApiErrorMeta,
} from '../decorators/error-response.decorator';
import {
    API_METHOD_META_KEY,
    ApiMethodMeta,
} from '../decorators/http-method.decorator';
import {
    API_PARAM_META_KEY,
    ApiParamMeta,
} from '../decorators/param.decorator';
import { Err, Ok } from '../result';
import { NexusHttpError, NexusHttpService } from './nexus-http.service';

export function createNexusClientProvider<T>(
    clientClass: Type<T>,
): Provider<T> {
    return {
        provide: clientClass,
        inject: [
            NexusHttpService,
            { token: ConfigService, optional: true },
        ],
        useFactory: (
            httpService: NexusHttpService,
            configService?: ConfigService,
        ) => {
            const clientOptions: ApiClientOptions = Reflect.getMetadata(
                API_CLIENT_META_KEY,
                clientClass,
            );

            if (!clientOptions) {
                throw new Error(
                    `[Nexus] Classe ${clientClass.name} não possui o decorator @ApiClient.`,
                );
            }

            const resolvedOptions = { ...clientOptions };

            if (!resolvedOptions.baseUrl && resolvedOptions.baseUrlEnvKey) {
                if (!configService) {
                    throw new Error(
                        `[Nexus] ${clientClass.name} usa 'baseUrlEnvKey' mas ConfigService não está disponível.`,
                    );
                }
                resolvedOptions.baseUrl = configService.get<string>(
                    resolvedOptions.baseUrlEnvKey,
                );
            }

            if (!resolvedOptions.timeout && resolvedOptions.timeoutEnvKey) {
                if (configService) {
                    resolvedOptions.timeout = configService.get<number>(
                        resolvedOptions.timeoutEnvKey,
                    );
                }
            }

            if (!resolvedOptions.baseUrl) {
                throw new Error(
                    `[Nexus] ${clientClass.name} não conseguiu resolver a 'baseUrl'.`,
                );
            }

            // FIX 1 (TS7053): Tipamos o proxy como um Record.
            // Ele mapeia nomes de métodos (string) para funções assíncronas.
            const serviceProxy: Record<string | symbol, (...args: any[]) => Promise<any>> = {};

            Object.getOwnPropertyNames(clientClass.prototype)
                .filter((name) => name !== 'constructor')
                .forEach((methodName) => {

                    serviceProxy[methodName] = async (...args: any[]) => {
                        const originalMethod = clientClass.prototype[methodName];

                        const methodMeta: ApiMethodMeta = Reflect.getMetadata(
                            API_METHOD_META_KEY,
                            originalMethod,
                        );
                        const paramsMeta: ApiParamMeta[] =
                            Reflect.getMetadata(
                                API_PARAM_META_KEY,
                                clientClass.prototype,
                                methodName,
                            ) || [];
                        const errorMeta: ApiErrorMeta =
                            Reflect.getMetadata(API_ERROR_META_KEY, originalMethod) ||
                            new Map();

                        if (!methodMeta) {
                            console.warn(
                                `[Nexus] Método ${clientClass.name}.${methodName} não tem decorator de método (ex: @Get). Será ignorado.`,
                            );
                            return;
                        }

                        let path = methodMeta.path;
                        const headers = { ...resolvedOptions.staticHeaders };
                        const queryParams = new URLSearchParams();
                        let body: any = undefined;

                        for (const param of paramsMeta) {
                            const argValue = args[param.index];
                            if (argValue === undefined) continue;

                            // FIX 2 (TS2345) & FIX 3 (TS2538):
                            // Adicionamos '&& param.name' para garantir que o nome exista
                            // antes de usá-lo como chave ou em .append()
                            if (param.type === 'path' && param.name) {
                                path = path.replace(`:${param.name}`, encodeURIComponent(argValue));
                            } else if (param.type === 'query' && param.name) {
                                queryParams.append(param.name, argValue);
                            } else if (param.type === 'body') {
                                body = argValue;
                            } else if (param.type === 'header' && param.name) {
                                headers[param.name] = argValue;
                            }
                        }

                        const queryString = queryParams.toString();
                        const finalUrl = queryString ? `${path}?${queryString}` : path;

                        try {
                            const response = await httpService.request(resolvedOptions, {
                                method: methodMeta.method,
                                url: finalUrl,
                                headers: headers,
                                data: body,
                            });

                            return Ok(response.data, response.status);
                        } catch (error) {
                            // FIX 4 (Erro 162): Removemos o <any> explícito.
                            const httpError = error as NexusHttpError;

                            if (httpError.isAxiosError && httpError.response) {
                                const status = httpError.response.status;
                                const errorDtoClass = errorMeta.get(status);

                                if (errorDtoClass) {
                                    return Err(httpError.response.data, status);
                                }
                            }

                            throw new Error(
                                `[Nexus] Erro não tratado em ${clientClass.name}.${methodName}: ${httpError.message}`,
                            );
                        }
                    };
                });

            return serviceProxy as T;
        },
    };
}
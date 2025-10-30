import { Provider, Abstract } from '@nestjs/common';
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
import { Err, Ok, Result } from '../result';
import { NexusHttpError, NexusHttpService } from './nexus-http.service';
import {
    transformAndValidate,
} from './validation.helper';

export function createNexusClientProvider<T extends object>(
    clientClass: Abstract<T>,
): Provider<T> {
    return {
        provide: clientClass,
        inject: [NexusHttpService, { token: ConfigService, optional: true }],
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

            const serviceProxy: Record<
                string | symbol,
                (...args: any[]) => Promise<Result<any, any>>
            > = {};

            for (const methodName of Object.getOwnPropertyNames(
                clientClass.prototype,
            )) {
                if (methodName === 'constructor') continue;

                const methodMeta: ApiMethodMeta | undefined = Reflect.getMetadata(
                    API_METHOD_META_KEY,
                    clientClass.prototype,
                    methodName,
                );

                if (methodMeta) {
                    const paramsMeta: ApiParamMeta[] =
                        Reflect.getMetadata(
                            API_PARAM_META_KEY,
                            clientClass.prototype,
                            methodName,
                        ) || [];

                    const errorMeta: ApiErrorMeta =
                        Reflect.getMetadata(
                            API_ERROR_META_KEY,
                            clientClass.prototype,
                            methodName,
                        ) || new Map();

                    serviceProxy[methodName] = async (...args: any[]) => {
                        let path = methodMeta.path;
                        const headers = { ...resolvedOptions.staticHeaders };
                        const queryParams = new URLSearchParams();
                        let body: any = undefined;

                        for (const param of paramsMeta) {
                            const argValue = args[param.index];
                            if (argValue === undefined) continue;
                            if (param.type === 'path' && param.name) {
                                path = path.replace(`:${param.name}`, encodeURIComponent(argValue));
                            } else if (param.type === 'query' && param.name) {
                                queryParams.append(param.name, String(argValue));
                            } else if (param.type === 'body') {
                                body = argValue;
                            } else if (param.type === 'header' && param.name) {
                                headers[param.name] = String(argValue);
                            }
                        }

                        const queryString = queryParams.toString();
                        const finalUrl = queryString ? `${path}?${queryString}` : path;

                        try {
                            const response = await httpService.request(resolvedOptions, {
                                method: methodMeta.method, url: finalUrl, headers: headers, data: body,
                            });
                            return Ok(response.data, response.status);
                        } catch (error) {
                            const httpError = error as NexusHttpError;
                            if (httpError.isAxiosError && httpError.response) {
                                const status = httpError.response.status;
                                const errorDtoClass = errorMeta.get(status);

                                if (errorDtoClass) {
                                    try {
                                        const validatedErrorData = await transformAndValidate(
                                            httpError.response.data, errorDtoClass, status,
                                        );
                                        return Err(validatedErrorData, status);
                                    } catch (validationError) {
                                        throw validationError;
                                    }
                                }
                            }

                            const errorMessage = (httpError as unknown as Error)?.message || String(error);
                            throw new Error(
                                `[Nexus] Erro não tratado em ${clientClass.name}.${methodName}: ${errorMessage}`,
                            );
                        }
                    };
                }
            }

            return serviceProxy as T;
        },
    };
}
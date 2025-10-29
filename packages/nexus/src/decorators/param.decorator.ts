import 'reflect-metadata';

export const API_PARAM_META_KEY = Symbol('ApiParamMeta');

export type ParamType = 'path' | 'query' | 'body' | 'header';

export interface ApiParamMeta {
    index: number;
    type: ParamType;
    name?: string;
}

const createParamDecorator =
    (type: ParamType) =>
        (name?: string): ParameterDecorator => {
            return (
                target: Object,
                propertyKey: string | symbol | undefined,
                parameterIndex: number,
            ) => {
                if (!propertyKey) {
                    throw new Error(
                        `@${type.charAt(0).toUpperCase() + type.slice(
                            1,
                        )} decorator não pode ser usado em parâmetros de construtor.`,
                    );
                }

                const existingParams: ApiParamMeta[] =
                    Reflect.getMetadata(
                        API_PARAM_META_KEY,
                        target,
                        propertyKey,
                    ) || [];

                existingParams.push({
                    index: parameterIndex,
                    type: type,
                    name: type === 'body' ? undefined : name,
                });

                Reflect.defineMetadata(
                    API_PARAM_META_KEY,
                    existingParams,
                    target,
                    propertyKey,
                );
            };
        };

export const Path = createParamDecorator('path');
export const Query = createParamDecorator('query');
export const Body = createParamDecorator('body');
export const Header = createParamDecorator('header');
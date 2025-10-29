import 'reflect-metadata';

export const API_METHOD_META_KEY = Symbol('ApiMethodMeta');

export interface ApiMethodMeta {
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
}

const createMethodDecorator =
    (method: ApiMethodMeta['method']) =>
        (path = ''): MethodDecorator => {
            return (
                _target: Object,
                _propertyKey: string | symbol,
                descriptor: PropertyDescriptor,
            ) => {
                const meta: ApiMethodMeta = { method, path };

                Reflect.defineMetadata(API_METHOD_META_KEY, meta, descriptor.value);
            };
        };

export const Get = createMethodDecorator('GET');
export const Post = createMethodDecorator('POST');
export const Put = createMethodDecorator('PUT');
export const Patch = createMethodDecorator('PATCH');
export const Delete = createMethodDecorator('DELETE');
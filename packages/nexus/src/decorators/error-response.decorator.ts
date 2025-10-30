import 'reflect-metadata';

export const API_ERROR_META_KEY = Symbol('ApiErrorMeta');

/**
 * Os metadados são um Map onde:
 * Key = status code (ex: 400)
 * Value = DTO de erro (ex: HinovaValidationError)
 */
export type ApiErrorMeta = Map<number, any>; // 'any' aqui é o construtor da classe (typeof MyClass)

export function ErrorResponse(
    status: number,
    dto: any,
): MethodDecorator {
    return (
        target: Object,
        propertyKey: string | symbol,
        _descriptor: PropertyDescriptor,
    ) => {
        const existingErrors: ApiErrorMeta =
            Reflect.getMetadata(
                API_ERROR_META_KEY,
                target,
                propertyKey
            ) || new Map<number, any>();

        if (existingErrors.has(status)) {
            console.warn(
                `[${target.constructor.name}.${String(
                    propertyKey,
                )}] @ErrorResponse duplicado para o status ${status}. Apenas o último será usado.`,
            );
        }

        existingErrors.set(status, dto);

        Reflect.defineMetadata(
            API_ERROR_META_KEY,
            existingErrors,
            target,
            propertyKey
        );
    };
}
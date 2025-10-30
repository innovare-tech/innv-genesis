import { Type } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validateOrReject, ValidationError } from 'class-validator';

export class NexusValidationException extends Error {
    constructor(
        public readonly validationErrors: ValidationError[],
        public readonly targetClass: Type<any>,
        public readonly responseStatus: number,
    ) {
        const messages = validationErrors
            .map((err) => Object.values(err.constraints || {}).join(', '))
            .join('; ');
        super(
            `[Nexus Validation Error] A resposta da API (status ${responseStatus}) falhou na validação contra ${targetClass.name}: ${messages}`,
        );
        this.name = 'NexusValidationException';
    }
}

export async function transformAndValidate<T extends object>(
    plainObject: any,
    dtoClass: Type<T>,
    responseStatus: number,
): Promise<T> {
    if (!dtoClass) {
        return plainObject as T;
    }

    const instance = plainToInstance(dtoClass, plainObject, {
        enableImplicitConversion: true,
    });

    try {
        await validateOrReject(instance, {
            whitelist: true,
            forbidNonWhitelisted: true,
        });
        return instance;
    } catch (errors) {
        if (Array.isArray(errors) && errors[0] instanceof ValidationError) {
            throw new NexusValidationException(errors, dtoClass, responseStatus);
        }
        throw errors;
    }
}
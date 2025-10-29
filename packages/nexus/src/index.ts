/**
 * @innv/nexus
 * Ponto de entrada principal da biblioteca.
 */

// Core
export * from './result';

// Decorators
export * from './decorators/api-client.decorator';
export * from './decorators/error-response.decorator';
export * from './decorators/http-method.decorator';
export * from './decorators/param.decorator';

// NestJS Integration
export * from './nest/nexus.module';
export * from './nest/nexus-client.provider';
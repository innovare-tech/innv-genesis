import 'reflect-metadata';

export const API_CLIENT_META_KEY = Symbol('ApiClientMeta');

export interface ApiClientOptions {
  /**
   * (OPÇÃO 1) Define a URL base diretamente no código.
   */
  baseUrl?: string;

  /**
   * (OPÇÃO 2) A chave do .env (via ConfigService) que contém a URL base.
   */
  baseUrlEnvKey?: string;

  /**
   * (OPÇÃO 1) Define o timeout em milissegundos diretamente.
   */
  timeout?: number;

  /**
   * (OPÇÃO 2) A chave do .env (via ConfigService) para o timeout.
   */
  timeoutEnvKey?: string;

  /**
   * Define headers estáticos que serão enviados em TODAS as requisições
   * deste cliente.
   */
  staticHeaders?: Record<string, string>;

  // interceptors?: Type<HttpInterceptor>[]; // Deixaremos para a integração Nest
}

export function ApiClient(options: ApiClientOptions): ClassDecorator {
  return (target: Function) => {
    if (!options.baseUrl && !options.baseUrlEnvKey) {
      throw new Error(
        `[${target.name}] deve prover 'baseUrl' ou 'baseUrlEnvKey' no @ApiClient`,
      );
    }

    Reflect.defineMetadata(API_CLIENT_META_KEY, options, target);
  };
}

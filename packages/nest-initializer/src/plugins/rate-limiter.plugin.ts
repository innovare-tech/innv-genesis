// src/plugins/rate-limiter.plugin.ts
import { INestApplication, Logger } from '@nestjs/common';
import { AppInitializerPlugin } from '../core';
import { tryRequire } from '../utils/tryRequire';

export class RateLimiterPlugin implements AppInitializerPlugin {
  private readonly logger = new Logger(RateLimiterPlugin.name);
  private readonly options: any;

  constructor(options: Partial<any> = {}) {
    this.options = {
      windowMs: 15 * 60 * 1000,
      limit: 100,
      statusCode: 429,
      message:
        'Too many requests from this IP, please try again after 15 minutes',
      standardHeaders: true,
      legacyHeaders: false,
      ...options,
    };
  }

  apply(app: INestApplication): void {
    // tenta carregar o pacote; se não existir, apenas loga e retorna
    const loaded = tryRequire<any>('express-rate-limit');
    if (!loaded) {
      this.logger.warn(
        '[nest-initializer] express-rate-limit não encontrado — rate limiter desabilitado.',
      );
      return;
    }

    // resolver a função chamável: suporte CommonJS e ESM (module, module.default, module.rateLimit)
    const rateLimitFn =
      typeof loaded === 'function'
        ? loaded
        : typeof loaded.default === 'function'
          ? loaded.default
          : typeof loaded.rateLimit === 'function'
            ? loaded.rateLimit
            : null;

    if (!rateLimitFn) {
      this.logger.warn(
        '[nest-initializer] express-rate-limit importado, mas não contém função chamável — rate limiter desabilitado.',
      );
      return;
    }

    // chama a factory para obter o middleware e registra no app (apenas uma vez)
    const middleware = rateLimitFn(this.options);
    if (!middleware) {
      this.logger.warn(
        '[nest-initializer] express-rate-limit retornou um middleware falsy — ignorando.',
      );
      return;
    }

    app.use(middleware);
  }
}

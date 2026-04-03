import 'reflect-metadata';
import { VersioningType } from '@nestjs/common';
import { AppInitializer, RequestLoggerPlugin } from '@innv/nest-initializer';
import { setupBackendKit } from '@innovare-tech/backend-kit';
import { AppModule } from './app.module';

void AppInitializer.bootstrap(AppModule, (app) => {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // 1. Backend Kit — configura auth, rbac, exception filter, response mapper e validation
  setupBackendKit(app, {
    auth: { jwtSecretConfigKey: 'JWT_SECRET' },
    rbac: true,
    exceptionFilter: true,
    responseMapper: true,
    validation: true,
  });

  // 2. Configurações adicionais do AppInitializer
  app
    .onPort(parseInt(process.env.PORT || '3000', 10))
    .withIndexPage()
    .withGlobalPrefix('/api')
    .withVersioning({
      type: VersioningType.URI,
      prefix: 'v',
      defaultVersion: '1',
    })
    .withCors({ origin: '*' })
    .withSwagger({
      title: 'Backend Kit Example API',
      description:
        'API de exemplo demonstrando @innv/backend-kit + @innv/nest-initializer',
      version: '1.0.0',
      path: 'docs',
    })
    .withGracefulShutdown()
    .enableCompression()
    .when(isDevelopment, (builder) => {
      builder.withPlugin(new RequestLoggerPlugin());
    });
});

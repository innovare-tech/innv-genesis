import { Type } from '@nestjs/common';
import { JwtAuthGuard, JwtAuthGuardOptions } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { GlobalExceptionFilter } from '../filters/global-exception.filter';
import { ResponseData } from '../response/response-data';

export interface BackendKitAuthOptions extends JwtAuthGuardOptions {
  enabled?: boolean;
}

export interface BackendKitRbacOptions {
  enabled?: boolean;
  guard?: Type;
}

export interface BackendKitExceptionFilterOptions {
  enabled?: boolean;
  filter?: Type;
}

export interface BackendKitResponseMapperOptions {
  enabled?: boolean;
  mapper?: (data: unknown) => unknown;
}

export interface BackendKitValidationOptions {
  enabled?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  transform?: boolean;
}

export interface BackendKitSetupOptions {
  auth?: BackendKitAuthOptions | boolean;
  rbac?: BackendKitRbacOptions | boolean;
  exceptionFilter?: BackendKitExceptionFilterOptions | boolean;
  responseMapper?: BackendKitResponseMapperOptions | boolean;
  validation?: BackendKitValidationOptions | boolean;
}

interface AppInitializerLike {
  useGlobalGuard(guard: Type): this;
  useGlobalFilter(filter: Type): this;
  withValidationPipe(options?: Record<string, unknown>): this;
  withResponseMapper<T>(mapper: (data: unknown) => T): this;
}

export function setupBackendKit<T extends AppInitializerLike>(
  app: T,
  options: BackendKitSetupOptions = {},
): T {
  const authOpts = normalizeOption<BackendKitAuthOptions>(options.auth, {
    enabled: true,
  });
  const rbacOpts = normalizeOption<BackendKitRbacOptions>(options.rbac, {
    enabled: true,
  });
  const filterOpts = normalizeOption<BackendKitExceptionFilterOptions>(
    options.exceptionFilter,
    { enabled: true },
  );
  const responseOpts = normalizeOption<BackendKitResponseMapperOptions>(
    options.responseMapper,
    { enabled: true },
  );
  const validationOpts = normalizeOption<BackendKitValidationOptions>(
    options.validation,
    {
      enabled: true,
    },
  );

  if (authOpts.enabled) {
    app.useGlobalGuard(JwtAuthGuard);
  }

  if (rbacOpts.enabled) {
    app.useGlobalGuard(rbacOpts.guard ?? RolesGuard);
  }

  if (filterOpts.enabled) {
    app.useGlobalFilter(filterOpts.filter ?? GlobalExceptionFilter);
  }

  if (responseOpts.enabled) {
    const mapper =
      responseOpts.mapper ??
      ((data: unknown) =>
        ResponseData.builder().successful().withData(data).build());
    app.withResponseMapper(mapper);
  }

  if (validationOpts.enabled) {
    app.withValidationPipe({
      whitelist: validationOpts.whitelist ?? true,
      forbidNonWhitelisted: validationOpts.forbidNonWhitelisted ?? true,
      transform: validationOpts.transform ?? true,
      transformOptions: { enableImplicitConversion: true },
    });
  }

  return app;
}

function normalizeOption<T extends { enabled?: boolean }>(
  option: T | boolean | undefined,
  defaults: T,
): T {
  if (option === undefined) return defaults;
  if (typeof option === 'boolean') return { ...defaults, enabled: option };
  return { ...defaults, ...option };
}

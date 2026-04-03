import { applyDecorators, Controller, UseGuards } from '@nestjs/common';
import { ControllerOptions } from '@nestjs/common/decorators/core/controller.decorator';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { TenantAccessGuard } from '../tenant/tenant-access.guard';
import { RolesGuard } from '../guards/roles.guard';

export interface TenantControllerOptions {
  path?: string;
  version?: string;
  routeParam?: string;
}

export function TenantController(
  options: TenantControllerOptions = {},
): ClassDecorator {
  const routeParam = options.routeParam ?? 'orgSlug';
  const basePath = `organizations/:${routeParam}`;
  const fullPath = options.path ? `${basePath}/${options.path}` : basePath;

  return applyDecorators(
    Controller({
      path: fullPath,
      version: options.version,
    } as ControllerOptions),
    UseGuards(TenantAccessGuard, RolesGuard),
    ApiBearerAuth('access-token'),
    ApiParam({
      name: routeParam,
      required: true,
      description: 'Slug identificador do tenant (contexto do acesso)',
      type: String,
      example: 'minha-organizacao',
    }),
  );
}

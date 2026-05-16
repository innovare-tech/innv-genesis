import { AuthResponseDTO } from '../../auth/dtos/auth-response.dto';

/**
 * Contrato consumido por `BkPlatformService.impersonate`. A
 * implementação concreta é `BkAuthService.impersonate` (introduzido
 * na Task 4.0 do PRD `prd-platform-admin-impersonation`).
 *
 * Mantido como interface separada para evitar ciclo de imports entre
 * o módulo `platform` e o módulo `auth`, e para permitir mock simples
 * em testes do `BkPlatformService`.
 */
export interface PlatformImpersonator {
  impersonate(
    adminUserId: string,
    targetUserId: string,
  ): Promise<AuthResponseDTO>;
}

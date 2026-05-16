/**
 * Contratos tipados dos eventos do domínio Platform Admin emitidos via
 * `BkEvents`. Centralizar aqui (em vez de no módulo `platform`) evita
 * acoplamento de consumers do evento ao módulo de feature.
 */

/**
 * Payload do evento `BkEvents.PLATFORM_IMPERSONATE_STARTED` — emitido
 * por `BkAuthService.impersonate` e consumido pelo
 * `BkPlatformAuditListener`.
 */
export interface PlatformImpersonateStartedData {
  adminUserId: string;
  adminEmail: string;
  targetUserId: string;
  targetEmail: string;
  targetOrgId: string;
  targetOrgName: string;
  targetRole?: string;
}

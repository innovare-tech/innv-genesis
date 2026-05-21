import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { BkEvents, BkEventPayload } from '../../events/bk-events';
import { PlatformImpersonateStartedData } from '../../events/platform-events';
import { BkPlatformAuditRepository } from '../repositories/platform-audit.repository';

/**
 * Persiste cada início de impersonação na coleção
 * `bk_platform_admin_audit`. Listener idempotente do ponto de vista do
 * domínio (cada evento gera um doc novo — auditoria não deduplica).
 */
@Injectable()
export class BkPlatformAuditListener {
  private readonly logger = new Logger(BkPlatformAuditListener.name);

  constructor(private readonly repo: BkPlatformAuditRepository) {}

  @OnEvent(BkEvents.PLATFORM_IMPERSONATE_STARTED)
  async handle(
    payload: BkEventPayload<PlatformImpersonateStartedData>,
  ): Promise<void> {
    const { timestamp, data } = payload;

    try {
      await this.repo.create({
        adminUserId: data.adminUserId,
        adminEmail: data.adminEmail,
        targetUserId: data.targetUserId,
        targetEmail: data.targetEmail,
        targetOrgId: data.targetOrgId,
        targetOrgName: data.targetOrgName,
        targetRole: data.targetRole,
        startedAt: timestamp,
      });

      this.logger.log(
        `[PLATFORM] ${data.adminEmail} impersonou ${data.targetEmail} no tenant ${data.targetOrgName}`,
      );
    } catch (err) {
      // Falha no audit não pode derrubar a impersonação — log + swallow.
      this.logger.error(
        `[PLATFORM] Falha ao gravar audit de impersonação: ${(err as Error).message}`,
      );
    }
  }
}

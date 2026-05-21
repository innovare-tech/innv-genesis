import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { BkOrganizationsRepository } from '../../organizations/repositories/organizations.repository';
import { BkMembersRepository } from '../../members/repositories/members.repository';
import { BkUsersRepository } from '../../auth/repositories/users.repository';
import { AuthResponseDTO } from '../../auth/dtos/auth-response.dto';
import { BkEvents, createBkEvent } from '../../events/bk-events';
import { PlatformImpersonateStartedData } from '../../events/platform-events';
import { PLATFORM_IMPERSONATOR } from '../../feature.constants';
import { PlatformImpersonator } from '../interfaces/platform-impersonator.interface';
import { PlatformTenantDTO } from '../dtos/platform-tenant.dto';
import { PlatformUserDTO } from '../dtos/platform-user.dto';

/**
 * Service cross-tenant que orquestra listagens de tenants/usuários e
 * delega impersonação para o `PlatformImpersonator` injetado (na prática
 * `BkAuthService.impersonate`). Não bypassa nenhum guard — todo acesso
 * subsequente é mediado pelo JWT emitido para o usuário-alvo.
 */
@Injectable()
export class BkPlatformService {
  constructor(
    private readonly organizationsRepo: BkOrganizationsRepository,
    private readonly membersRepo: BkMembersRepository,
    private readonly usersRepo: BkUsersRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(PLATFORM_IMPERSONATOR)
    private readonly impersonator: PlatformImpersonator,
  ) {}

  async listTenants(): Promise<PlatformTenantDTO[]> {
    const orgs = await this.organizationsRepo.find({});
    if (orgs.length === 0) return [];

    const orgIds = orgs.map((org) => org._id);
    const counts = await this.membersRepo.countActiveByOrgIds(orgIds);

    return orgs.map((org) => ({
      id: String(org._id),
      name: org.name,
      slug: org.slug,
      status: org.status,
      memberCount: counts.get(String(org._id)) ?? 0,
    }));
  }

  async listUsers(orgId: string): Promise<PlatformUserDTO[]> {
    const memberships = await this.membersRepo.findByOrgId(orgId);

    return memberships.map((m) => ({
      id: String(m.user.id),
      name: m.user.name,
      email: m.user.email,
      role: this.deriveRole(m),
      status: m.status,
    }));
  }

  async impersonate(
    adminUserId: string,
    targetUserId: string,
  ): Promise<AuthResponseDTO> {
    // O `impersonator` (BkAuthService.impersonate) já valida target ACTIVE
    // e gera a resposta com a claim `impersonatedBy`. Aqui adicionamos a
    // camada de auditoria: pré-carrega contexto (admin + membership) e
    // emite o evento rico — falha de auditoria não derruba a impersonação
    // (o listener faz swallow do erro).
    const [admin, target] = await Promise.all([
      this.usersRepo.findById(adminUserId),
      this.usersRepo.findById(targetUserId),
    ]);

    if (!target || target.status !== 'ACTIVE') {
      throw new UnauthorizedException(
        'Usuário-alvo inativo ou não encontrado.',
      );
    }

    const memberships = await this.membersRepo.findByUserId(targetUserId);
    const primary = memberships[0]; // v1: snapshot da primeira membership ativa.

    const response = await this.impersonator.impersonate(
      adminUserId,
      targetUserId,
    );

    // Expõe `impersonatedBy` no payload do login para o frontend
    // conhecer o estado sem precisar decodificar o JWT (consumido pelo
    // `FranchiseUserContext` + `ImpersonationBanner`). A claim
    // equivalente já está no JWT via `buildAccessTokenClaims`.
    if (response.user) {
      response.user.impersonatedBy = adminUserId;
    } else {
      response.user = { impersonatedBy: adminUserId };
    }

    const auditPayload: PlatformImpersonateStartedData = {
      adminUserId,
      adminEmail: admin?.email ?? 'unknown',
      targetUserId,
      targetEmail: target.email,
      targetOrgId: primary ? String(primary.organization.id) : 'unknown',
      targetOrgName: primary?.organization.name ?? 'unknown',
      targetRole: primary ? this.deriveRole(primary) : undefined,
    };

    this.eventEmitter.emit(
      BkEvents.PLATFORM_IMPERSONATE_STARTED,
      createBkEvent(auditPayload),
    );

    return response;
  }

  private deriveRole(membership: {
    isOwner: boolean;
    customRoles?: string[];
  }): string {
    if (membership.isOwner) return 'ADMIN';
    if (membership.customRoles && membership.customRoles.length > 0) {
      return membership.customRoles[0];
    }
    return 'UNKNOWN';
  }
}

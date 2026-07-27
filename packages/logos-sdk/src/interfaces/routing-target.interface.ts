/**
 * Destinos de escalação (departamentos e atendentes) de um agente.
 *
 * O Logos não descobre os destinos sozinho: o sistema do cliente os sincroniza
 * e o bot escolhe entre eles quando decide escalar. O `externalId` é o elo com
 * o sistema de origem — é ele que volta em `BotDecisionTarget.externalId` no
 * webhook, para o consumer rotear o atendimento internamente.
 */

/** Mesmos valores de `BotDecisionTarget.type`. */
export type RoutingTargetType = 'DEPARTMENT' | 'AGENT';

/**
 * `OPEN` e `BUSY` são ambos elegíveis — o engine só exclui `CLOSED` das opções
 * oferecidas ao modelo. `BUSY` entra no prompt apenas como sinal textual, e o
 * modelo decide se evita; não é um bloqueio.
 */
export type RoutingTargetStatus = 'OPEN' | 'CLOSED' | 'BUSY';

export interface CreateRoutingTargetInput {
  /** ID do destino no sistema do cliente (ex.: `dept_financeiro_001`). */
  externalId: string;
  type: RoutingTargetType;
  name: string;
  /**
   * Texto que o modelo lê para decidir o roteamento — é o campo que mais
   * influencia a escolha. Descreva o escopo do destino, não só o rótulo.
   */
  description: string;
  /** Livre; o Logos armazena mas **não** interpreta (não entra no prompt). */
  metadata?: Record<string, any>;
  /** ObjectIds de tags já existentes no catálogo da organização. */
  tagIds?: string[];
}

/** Todos os campos opcionais; `status` só pode ser alterado por update. */
export interface UpdateRoutingTargetInput {
  externalId?: string;
  type?: RoutingTargetType;
  name?: string;
  description?: string;
  status?: RoutingTargetStatus;
  metadata?: Record<string, any>;
  tagIds?: string[];
}

export interface RoutingTargetResponse {
  /** ID interno do Logos. É o que o roteador referencia internamente. */
  id: string;
  organizationId: string;
  agentId: string;
  externalId: string;
  type: RoutingTargetType;
  name: string;
  description: string;
  status: RoutingTargetStatus;
  metadata?: Record<string, any>;
  tagIds?: string[];
  createdAt: string;
  updatedAt: string;
}

import { Inject, Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LOGOS_OPTIONS } from './logos.constants';
import { LogosModuleOptions } from './interfaces/logos-config.interface';
import { IngestMessage, IngestResponse } from './interfaces/message.interface';
import {
  CreateAgentInput,
  UpdateAgentInput,
  AgentResponse,
} from './interfaces/agent.interface';
import { SessionResponse } from './interfaces/session.interface';
import {
  CreateRoutingTargetInput,
  RoutingTargetResponse,
  RoutingTargetStatus,
  UpdateRoutingTargetInput,
} from './interfaces/routing-target.interface';
import { LogosApiException } from './exceptions/logos-api.exception';

@Injectable()
export class LogosService {
  private readonly logger = new Logger(LogosService.name);
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;

  constructor(
    @Inject(LOGOS_OPTIONS) options: LogosModuleOptions,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = `${options.baseUrl}/api/v1`;
    this.headers = {
      'Content-Type': 'application/json',
      'X-API-Key': options.apiKey,
    };
    this.timeout = options.timeout ?? 10000;
  }

  async sendMessage(
    agentId: string,
    message: IngestMessage,
  ): Promise<IngestResponse> {
    return this.post<IngestResponse>(`/agents/${agentId}/messages`, message);
  }

  async getSession(
    agentId: string,
    sessionId: string,
  ): Promise<SessionResponse> {
    return this.get<SessionResponse>(
      `/agents/${agentId}/sessions/${sessionId}`,
    );
  }

  async createAgent(agent: CreateAgentInput): Promise<AgentResponse> {
    return this.post<AgentResponse>('/agents', agent);
  }

  async updateAgent(
    agentId: string,
    agent: UpdateAgentInput,
  ): Promise<AgentResponse> {
    return this.put<AgentResponse>(`/agents/${agentId}`, agent);
  }

  async getAgent(agentId: string): Promise<AgentResponse> {
    return this.get<AgentResponse>(`/agents/${agentId}`);
  }

  async listAgents(): Promise<AgentResponse[]> {
    return this.get<AgentResponse[]>('/agents');
  }

  async deleteAgent(agentId: string): Promise<void> {
    await this.delete(`/agents/${agentId}`);
  }

  // ── Routing targets (destinos de escalação) ────────────────────────────
  //
  // O engine não expõe endpoint de sync em massa: a reconciliação é do
  // cliente. O padrão é listar, casar por `externalId`, criar o que falta,
  // atualizar o que divergiu e FECHAR (`status: 'CLOSED'`) o que sumiu — em
  // vez de deletar, para não perder histórico. Ver o exemplo no README.

  async listRoutingTargets(agentId: string): Promise<RoutingTargetResponse[]> {
    return this.get<RoutingTargetResponse[]>(
      `/agents/${agentId}/routing-targets`,
    );
  }

  /**
   * Cria um destino. **O engine força `status: 'OPEN'`** e ignora qualquer
   * status enviado aqui — para reabrir um destino fechado use
   * {@link updateRoutingTargetStatus}.
   *
   * ⚠️ Não há índice único em `(agentId, externalId)`: dois `create` com o
   * mesmo `externalId` produzem dois destinos duplicados, e o modelo passa a
   * ver a opção repetida. Garanta a idempotência no chamador.
   */
  async createRoutingTarget(
    agentId: string,
    input: CreateRoutingTargetInput,
  ): Promise<RoutingTargetResponse> {
    return this.post<RoutingTargetResponse>(
      `/agents/${agentId}/routing-targets`,
      input,
    );
  }

  async updateRoutingTarget(
    agentId: string,
    targetId: string,
    input: UpdateRoutingTargetInput,
  ): Promise<RoutingTargetResponse> {
    return this.patch<RoutingTargetResponse>(
      `/agents/${agentId}/routing-targets/${targetId}`,
      input,
    );
  }

  /**
   * Só `CLOSED` remove o destino das opções do bot. `BUSY` continua elegível —
   * entra no prompt como sinal para o modelo, não como bloqueio.
   */
  async updateRoutingTargetStatus(
    agentId: string,
    targetId: string,
    status: RoutingTargetStatus,
  ): Promise<RoutingTargetResponse> {
    return this.patch<RoutingTargetResponse>(
      `/agents/${agentId}/routing-targets/${targetId}/status`,
      { status },
    );
  }

  /** Hard delete. Para desativar preservando histórico, prefira `CLOSED`. */
  async deleteRoutingTarget(
    agentId: string,
    targetId: string,
  ): Promise<void> {
    await this.delete(`/agents/${agentId}/routing-targets/${targetId}`);
  }

  private async get<T>(path: string): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.get<T>(
        `${this.baseUrl}${path}`,
        { headers: this.headers, timeout: this.timeout },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private async post<T>(path: string, body: any): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.post<T>(
        `${this.baseUrl}${path}`,
        body,
        { headers: this.headers, timeout: this.timeout },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private async put<T>(path: string, body: any): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.put<T>(
        `${this.baseUrl}${path}`,
        body,
        { headers: this.headers, timeout: this.timeout },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private async patch<T>(path: string, body: any): Promise<T> {
    try {
      const response = await this.httpService.axiosRef.patch<T>(
        `${this.baseUrl}${path}`,
        body,
        { headers: this.headers, timeout: this.timeout },
      );
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private async delete(path: string): Promise<void> {
    try {
      await this.httpService.axiosRef.delete(`${this.baseUrl}${path}`, {
        headers: this.headers,
        timeout: this.timeout,
      });
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): LogosApiException {
    if (error.response) {
      const status = error.response.status;
      const message =
        error.response.data?.message ||
        error.response.statusText ||
        'Unknown error';
      const body = error.response.data;
      this.logger.error(`[LogosSDK] HTTP ${status}: ${message}`);
      return new LogosApiException(status, message, body);
    }

    this.logger.error(`[LogosSDK] Network error: ${error.message}`);
    return new LogosApiException(0, error.message);
  }
}

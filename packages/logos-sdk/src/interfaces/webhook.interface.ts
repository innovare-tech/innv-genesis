import { OutboundMessage } from './outbound-message.interface';

export enum LogosBotAction {
  REPLY = 'REPLY',
  FINISH = 'FINISH',
  ESCALATE = 'ESCALATE',
  WAIT = 'WAIT',
}

export interface BotDecisionTarget {
  type: 'DEPARTMENT' | 'AGENT';
  externalId: string;
  name: string;
  reason?: string;
}

export interface BotDecision {
  action: LogosBotAction;
  message?: string;
  target?: BotDecisionTarget;
  /**
   * Mensagens ricas de saída (texto/mídia/localização/produto/menu
   * interativo). Aditivo e opcional: quando presente, o consumer despacha
   * cada item no canal (ex: `INTERACTIVE` → botões/lista no WhatsApp);
   * quando ausente, usa apenas `message`. Coexiste com `message` (nunca
   * o substitui — `message` continua sendo o fallback textual).
   */
  messages?: OutboundMessage[];
}

export interface LogosWebhookPayload {
  event: string;
  sessionId: string;
  decision?: BotDecision;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: number;
}

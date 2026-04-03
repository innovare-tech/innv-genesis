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
}

export interface LogosWebhookPayload {
  event: 'bot_decision' | string;
  sessionId: string;
  decision?: BotDecision;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: number;
}

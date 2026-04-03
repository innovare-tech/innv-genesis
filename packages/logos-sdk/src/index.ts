// @innv/logos-sdk — SDK NestJS para Logos Engine

export {
  LogosModuleOptions,
  LogosModuleAsyncOptions,
} from './interfaces/logos-config.interface';
export {
  LogosWebhookPayload,
  BotDecision,
  BotDecisionTarget,
  LogosBotAction,
} from './interfaces/webhook.interface';
export { IngestMessage, IngestResponse } from './interfaces/message.interface';
export {
  CreateAgentInput,
  UpdateAgentInput,
  AgentResponse,
} from './interfaces/agent.interface';
export { SessionResponse } from './interfaces/session.interface';

export { LOGOS_OPTIONS } from './logos.constants';
export { LogosService } from './logos.service';
export { LogosApiException } from './exceptions/logos-api.exception';
export { LogosModule } from './logos.module';
export { verifyWebhookSignature } from './utils/verify-signature';
export { LogosWebhookGuard } from './guards/webhook-signature.guard';

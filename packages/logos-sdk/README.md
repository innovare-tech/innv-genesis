# @innv/logos-sdk

SDK NestJS para integração com o **Logos Engine** — plataforma SaaS de chatbots conversacionais com IA.

## Instalação

```bash
npm install @innv/logos-sdk @nestjs/axios axios
```

## Quick Start

### 1. Configurar o módulo

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { LogosModule } from '@innv/logos-sdk';

@Module({
  imports: [
    LogosModule.forRoot({
      apiKey: 'SUA_API_KEY',
      baseUrl: 'https://api.logos-engine.com',
    }),
  ],
})
export class AppModule {}
```

**Configuração assíncrona** (ex: ler da env via ConfigService):

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

LogosModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    apiKey: config.get('LOGOS_API_KEY'),
    baseUrl: config.get('LOGOS_BASE_URL'),
    webhookSecret: config.get('LOGOS_WEBHOOK_SECRET'),
  }),
  inject: [ConfigService],
}),
```

### 2. Enviar mensagens

```typescript
import { Injectable } from '@nestjs/common';
import { LogosService } from '@innv/logos-sdk';

@Injectable()
export class ChatService {
  constructor(private readonly logos: LogosService) {}

  async handleUserMessage(phone: string, text: string) {
    const response = await this.logos.sendMessage('AGENT_ID', {
      sessionId: phone,
      input: text,
      contactReference: phone,
    });

    console.log(`Mensagem enfileirada: ${response.messageId}`);
  }
}
```

### 3. Receber webhooks

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { LogosWebhookPayload, LogosBotAction } from '@innv/logos-sdk';

@Controller('webhooks')
export class WebhookController {
  @Post('logos')
  handleWebhook(@Body() payload: LogosWebhookPayload) {
    if (payload.event === 'bot_decision' && payload.decision) {
      switch (payload.decision.action) {
        case LogosBotAction.REPLY:
          // Enviar mensagem de volta ao usuário
          this.sendToUser(payload.sessionId, payload.decision.message!);
          break;

        case LogosBotAction.FINISH:
          // Enviar mensagem final e encerrar sessão
          this.sendToUser(payload.sessionId, payload.decision.message!);
          this.closeSession(payload.sessionId);
          break;

        case LogosBotAction.ESCALATE:
          // Transferir para atendente humano
          this.transferToHuman(payload.sessionId, payload.decision.target!);
          break;
      }
    }
  }
}
```

## API Reference

### `LogosService`

| Método | Descrição | Retorno |
|--------|-----------|---------|
| `sendMessage(agentId, message)` | Envia mensagem para processamento | `IngestResponse` |
| `getSession(agentId, sessionId)` | Consulta estado de uma sessão | `SessionResponse` |
| `createAgent(agent)` | Cria um chatbot | `AgentResponse` |
| `updateAgent(agentId, agent)` | Atualiza chatbot | `AgentResponse` |
| `getAgent(agentId)` | Consulta chatbot | `AgentResponse` |
| `listAgents()` | Lista todos os chatbots | `AgentResponse[]` |
| `deleteAgent(agentId)` | Remove chatbot | `void` |

### Verificação de Webhook (HMAC)

```typescript
import { verifyWebhookSignature } from '@innv/logos-sdk';

const isValid = verifyWebhookSignature(
  rawBody,                    // string ou Buffer do body
  request.headers['x-webhook-signature'],  // header da assinatura
  'seu-webhook-secret',       // secret configurado no agent
);
```

**Ou usando o Guard automático:**

```typescript
import { UseGuards } from '@nestjs/common';
import { LogosWebhookGuard } from '@innv/logos-sdk';

@Post('logos')
@UseGuards(LogosWebhookGuard)
handleWebhook(@Body() payload: LogosWebhookPayload) {
  // A assinatura já foi validada pelo guard
}
```

## Tipos Exportados

```typescript
import {
  // Configuração
  LogosModuleOptions,
  LogosModuleAsyncOptions,

  // Módulo e Serviço
  LogosModule,
  LogosService,

  // Mensagens
  IngestMessage,
  IngestResponse,

  // Webhooks
  LogosWebhookPayload,
  BotDecision,
  BotDecisionTarget,
  LogosBotAction,

  // Agents
  CreateAgentInput,
  UpdateAgentInput,
  AgentResponse,

  // Sessions
  SessionResponse,

  // Helpers
  verifyWebhookSignature,
  LogosWebhookGuard,
  LogosApiException,
} from '@innv/logos-sdk';
```

## Tratamento de Erros

Todos os métodos do `LogosService` lançam `LogosApiException` em caso de erro HTTP:

```typescript
import { LogosApiException } from '@innv/logos-sdk';

try {
  await this.logos.getAgent('nonexistent-id');
} catch (error) {
  if (error instanceof LogosApiException) {
    console.error(`HTTP ${error.statusCode}: ${error.message}`);
    console.error('Response:', error.responseBody);
  }
}
```

## License

MIT

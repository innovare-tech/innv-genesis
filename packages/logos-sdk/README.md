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
| `listRoutingTargets(agentId)` | Lista destinos de escalação | `RoutingTargetResponse[]` |
| `createRoutingTarget(agentId, input)` | Cria destino | `RoutingTargetResponse` |
| `updateRoutingTarget(agentId, targetId, input)` | Atualiza destino | `RoutingTargetResponse` |
| `updateRoutingTargetStatus(agentId, targetId, status)` | Altera só o status | `RoutingTargetResponse` |
| `deleteRoutingTarget(agentId, targetId)` | Remove destino | `void` |

### Destinos de escalação (routing targets)

O Logos não descobre seus departamentos e atendentes sozinho — você os
sincroniza, e o bot escolhe entre eles quando decide escalar. O destino
escolhido volta em `decision.target.externalId` no webhook, para você rotear o
atendimento internamente.

Os campos que importam para o comportamento:

| Campo | Papel |
|---|---|
| `externalId` | O id no **seu** sistema. É o que volta no webhook. |
| `description` | O texto que o **modelo lê** para escolher. É o campo mais influente — descreva o escopo, não repita o nome. |
| `status` | `OPEN`, `BUSY` ou `CLOSED`. Ver a ressalva abaixo. |

**Duas coisas que pegam de surpresa:**

1. **`BUSY` não bloqueia.** O engine só exclui `CLOSED` das opções oferecidas ao
   modelo; `BUSY` continua elegível e entra no prompt apenas como sinal textual.
   Para tirar um destino da roda de verdade, use `CLOSED`.
2. **`createRoutingTarget` não é idempotente.** Não há índice único em
   `(agentId, externalId)` — chamar duas vezes com o mesmo `externalId` cria
   dois destinos duplicados, e o modelo passa a ver a opção repetida. Além
   disso, o `status` enviado no create é ignorado: todo destino nasce `OPEN`.

Por isso o sync é sempre **listar → casar por `externalId` → criar/atualizar**,
e fechar os que sumiram em vez de deletar (preserva o histórico das sessões que
já apontaram para eles):

```typescript
async syncDepartments(agentId: string, departments: Department[]) {
  const existing = await this.logos.listRoutingTargets(agentId);
  const byExternalId = new Map(existing.map((t) => [t.externalId, t]));
  const activeIds = new Set(departments.map((d) => d.id));

  for (const dept of departments) {
    const current = byExternalId.get(dept.id);
    const payload = {
      externalId: dept.id,
      type: 'DEPARTMENT' as const,
      name: dept.name,
      description: dept.description ?? `Atendimento de ${dept.name}`,
    };

    if (!current) {
      await this.logos.createRoutingTarget(agentId, payload);
      continue;
    }

    // Reabre se estava fechado e voltou a existir na origem.
    const changed =
      current.name !== payload.name ||
      current.description !== payload.description ||
      current.status === 'CLOSED';

    if (changed) {
      await this.logos.updateRoutingTarget(agentId, current.id, {
        ...payload,
        status: 'OPEN',
      });
    }
  }

  // Sumiu da origem → fecha, não deleta.
  for (const target of existing) {
    if (target.type !== 'DEPARTMENT') continue;
    if (activeIds.has(target.externalId)) continue;
    if (target.status === 'CLOSED') continue;

    await this.logos.updateRoutingTargetStatus(agentId, target.id, 'CLOSED');
  }
}
```

Os destinos sincronizados aparecem no painel do Logos na aba **Destinos** do
chatbot — útil para conferir se o sync rodou e o que o bot está enxergando.

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

  // Routing targets (destinos de escalação)
  RoutingTargetType,
  RoutingTargetStatus,
  CreateRoutingTargetInput,
  UpdateRoutingTargetInput,
  RoutingTargetResponse,

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

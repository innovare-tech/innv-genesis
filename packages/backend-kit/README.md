# @innovare-tech/backend-kit

> **Toolkit opinativa para backends NestJS — repositórios, exceções, guards, decorators, paginação e multi-tenancy.**

Parte do ecossistema **innv-genesis**. Complementa o `@innv/nest-initializer` (bootstrap) e o `@innv/nexus` (HTTP client declarativo) com abstrações de camada de aplicação, eliminando boilerplate repetitivo ao iniciar ou manter microsserviços NestJS.

---

## Por que usar `@innovare-tech/backend-kit`?

- **BaseRepository genérico**: CRUD Mongoose com 12 operações prontas, suporte a transações
- **Exceções padronizadas**: `BusinessException` + `ResponseData` builder para respostas consistentes
- **Guards reutilizáveis**: `JwtAuthGuard` configurável (não via herança) + `RolesGuard` com owner bypass
- **Multi-tenancy**: `TenantModule.forRoot()` + `@TenantController` + `@TenantContext` — qualquer conceito de tenant
- **Paginação pronta**: DTOs com validação, transformação e Swagger embutido
- **Zero boilerplate**: Com `@innv/nest-initializer` + `@innovare-tech/backend-kit`, um novo microsserviço sai pronto

---

## Instalação

```bash
pnpm add @innovare-tech/backend-kit @innv/nest-initializer
```

### Peer Dependencies

O kit requer que seu projeto tenha as dependências principais do NestJS:

```bash
pnpm add @nestjs/common @nestjs/core @nestjs/config @nestjs/jwt @nestjs/swagger
pnpm add class-validator class-transformer reflect-metadata mongoose
```

---

## Quick Start

### 1. Configure seu `main.ts`

```typescript
import { AppInitializer } from '@innv/nest-initializer';
import { GlobalExceptionFilter, JwtAuthGuard, ResponseData } from '@innovare-tech/backend-kit';
import { VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';

void AppInitializer.bootstrap(AppModule, (app) => {
  app
    .onPort(3000)
    .withGlobalPrefix('/api')
    .withVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: '1' })
    .useGlobalGuard(JwtAuthGuard)
    .useGlobalFilter(GlobalExceptionFilter)
    .withResponseMapper((data) =>
      ResponseData.builder().successful().withData(data).build(),
    )
    .withValidationPipe()
    .withSwagger({
      title: 'Minha API',
      description: 'Documentação da API',
      version: '1.0.0',
    })
    .withCors({ origin: '*' });
});
```

### 2. Configure o `AppModule`

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BackendKitModule, TenantModule } from '@innovare-tech/backend-kit';
import { OrgResolverService } from './organizations/org-resolver.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI),
    BackendKitModule.forRoot({
      jwt: { jwtSecretConfigKey: 'app.jwtSecret' },
    }),
    TenantModule.forRoot({
      resolver: OrgResolverService,
      routeParam: 'orgSlug',
    }),
  ],
})
export class AppModule {}
```

### 3. Crie um repositório

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '@innovare-tech/backend-kit';
import { Ticket } from './schemas/ticket.schema';

@Injectable()
export class TicketsRepository extends BaseRepository<Ticket> {
  constructor(@InjectModel(Ticket.name) model: Model<Ticket>) {
    super(model);
  }

  // Métodos herdados: create, findById, findOne, find, update,
  // updateMany, updateOne, findOneAndUpdate, bulkWrite, delete, countDocuments
  // + createWithSession para transações

  // Adicione queries específicas do domínio:
  findByProtocol(orgId: string, protocol: string) {
    return this.findOne({ organizationId: orgId, protocol });
  }
}
```

### 4. Crie um controller com multi-tenancy

```typescript
import { Get, Post, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  TenantController,
  TenantContext,
  AuthenticatedUser,
  Roles,
  PaginatedQueryResultDTO,
  SearchableQueryParamsDTO,
} from '@innovare-tech/backend-kit';

@ApiTags('Tickets')
@TenantController({ path: 'tickets', version: '1' })
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Listar tickets' })
  findAll(
    @TenantContext('id') organizationId: string,
    @Query() query: SearchableQueryParamsDTO,
  ): Promise<PaginatedQueryResultDTO<TicketDTO>> {
    return this.ticketsService.findAll(organizationId, query);
  }

  @Post()
  @Roles('create_ticket')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar ticket' })
  create(
    @TenantContext('id') orgId: string,
    @Body() dto: CreateTicketDTO,
    @AuthenticatedUser('sub') userId: string,
  ) {
    return this.ticketsService.create(orgId, dto, userId);
  }
}
```

---

## API Reference

### Módulos

| Classe | Descrição |
|--------|-----------|
| `BackendKitModule.forRoot(options?)` | Módulo raiz opcional para configuração centralizada (JWT options) |
| `TenantModule.forRoot(options)` | Módulo de multi-tenancy com `ITenantResolver` |

### Repository

| Classe | Descrição |
|--------|-----------|
| `BaseRepository<TDocument, TId>` | Repositório genérico Mongoose com 12 operações CRUD |

**Operações**: `create`, `createWithSession`, `findById`, `findOne`, `find`, `update`, `updateMany`, `updateOne`, `findOneAndUpdate`, `bulkWrite`, `delete`, `countDocuments`

### Exceções e Resposta

| Classe | Descrição |
|--------|-----------|
| `BusinessException` | Classe abstrata para exceções de negócio |
| `@HttpReturnCode(status)` | Associa HTTP status a uma classe de exceção |
| `ResponseData<T>` | Envelope de resposta padronizado com builder |
| `GlobalExceptionFilter` | Filtro global que converte exceções para `ResponseData` |

### Guards

| Classe | Descrição |
|--------|-----------|
| `JwtAuthGuard` | Guard JWT configurável via `JWT_AUTH_GUARD_OPTIONS` |
| `RolesGuard` | Guard de autorização por permissões com owner bypass (`*`) |
| `TenantAccessGuard` | Guard que resolve tenant via `ITenantResolver` |

### Decorators

| Decorator | Descrição |
|-----------|-----------|
| `@Public()` | Marca rota como pública (bypass do AuthGuard) |
| `@Roles(...roles)` | Define roles/permissões requeridas |
| `@AuthenticatedUser(field?)` | Extrai `user` do request |
| `@TenantController(options)` | Controller composto com guards e Swagger |
| `@TenantContext(field?)` | Extrai tenant do request |
| `@TenantUser(field?)` | Extrai user-in-tenant do request |

### Paginação

| Classe | Descrição |
|--------|-----------|
| `PaginatedQueryParamsDTO` | `page`, `limit`, `sortBy?`, `sortOrder?` com validação e Swagger |
| `PaginatedQueryResultDTO<T>` | `data`, `page`, `limit`, `total`, `totalPages` |
| `SearchableQueryParamsDTO` | Estende paginação com `search?` |
| `SortOrder` | Enum `ASC` / `DESC` |

### Interfaces e Tipos

| Interface | Descrição |
|-----------|-----------|
| `IMapper<TInput, TOutput>` | Contrato para mapper síncrono |
| `IAsyncMapper<TInput, TOutput>` | Contrato para mapper assíncrono |
| `ITenantResolver<TTenant>` | Contrato para resolução de tenant |
| `AuthenticatedRequest<TUser, TTenant>` | Request tipado com `user` e campos dinâmicos |

---

## Criando Exceções de Negócio

```typescript
import { HttpStatus } from '@nestjs/common';
import { BusinessException, HttpReturnCode } from '@innovare-tech/backend-kit';

@HttpReturnCode(HttpStatus.NOT_FOUND)
export class TicketNotFoundException extends BusinessException {
  constructor(ticketId: string) {
    super(
      'Ticket não encontrado',
      'TICKET_NOT_FOUND',
      `O ticket ${ticketId} não foi encontrado no sistema.`,
    );
  }
}
```

O `GlobalExceptionFilter` automaticamente:
1. Lê o `@HttpReturnCode` → retorna status 404
2. Converte para `ResponseData` com `successful: false`
3. Loga com stack trace via `Logger` do NestJS

---

## Implementando ITenantResolver

```typescript
import { Injectable } from '@nestjs/common';
import { ITenantResolver } from '@innovare-tech/backend-kit';

@Injectable()
export class OrgResolverService implements ITenantResolver<OrganizationDTO> {
  constructor(
    private readonly orgService: OrganizationsService,
    private readonly accessService: CheckAccessService,
  ) {}

  async resolve(slug: string, userId: string) {
    const org = await this.orgService.findBySlug(slug);
    const access = await this.accessService.check(userId, org.id);
    return { tenant: org, tenantUser: access.user };
  }
}
```

---

---

# V2 — Módulos de Negócio Prontos

A v2 adiciona **7 módulos opt-in** que transformam o kit em um framework de aplicação SaaS multi-tenant completo. Com uma chamada, você tem auth, users, organizations, RBAC, convites e account — tudo funcionando.

## Setup Mínimo V2

### `app.module.ts` — 30 linhas, backend SaaS completo

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BackendKitModule } from '@innovare-tech/backend-kit';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGO_URI'),
      }),
    }),
    JwtModule.register({ global: true, signOptions: { algorithm: 'HS512' } }),

    BackendKitModule.forRoot({
      jwt: { jwtSecretConfigKey: 'JWT_SECRET' },
      auth: true,
      users: true,
      organizations: true,
      profiles: { defaultProfiles: [{ name: 'Admin', roles: ['*'] }] },
      members: true,
      invites: { onSendInvite: (inv) => mailer.send(inv) },
      account: true,
    }),
  ],
})
export class AppModule {}
```

## Endpoints Gerados Automaticamente

| Módulo | Endpoint | Descrição |
|--------|----------|-----------|
| **Auth** | `POST /auth/login` | Login com e-mail e senha |
| **Auth** | `POST /auth/signup` | Criar nova conta |
| **Auth** | `POST /auth/refresh` | Renovar tokens (rotation) |
| **Auth** | `POST /auth/password/forgot` | Solicitar código de recuperação |
| **Auth** | `POST /auth/password/validate` | Validar código |
| **Auth** | `POST /auth/password/reset` | Resetar senha |
| **Auth** | `POST /auth/verify-email` | Verificar e-mail |
| **Auth** | `POST /auth/switch/:orgId` | Trocar organização |
| **Users** | `GET /users` | Listar usuários (paginado) |
| **Users** | `GET /users/:id` | Buscar por ID |
| **Users** | `PUT /users/:id` | Atualizar usuário |
| **Users** | `PUT /users/:id/status` | Ativar/desativar |
| **Orgs** | `POST /organizations` | Criar organização |
| **Orgs** | `GET /organizations` | Listar (paginado) |
| **Orgs** | `GET /organizations/:slug` | Buscar por slug |
| **Orgs** | `PUT /organizations/:id` | Atualizar |
| **Profiles** | `POST /organizations/:orgSlug/profiles` | Criar perfil |
| **Profiles** | `GET /organizations/:orgSlug/profiles` | Listar perfis |
| **Members** | `POST /organizations/:orgSlug/members` | Adicionar membro |
| **Members** | `GET /organizations/:orgSlug/members` | Listar membros |
| **Members** | `PUT /organizations/:orgSlug/members/:id/rbac` | Alterar RBAC |
| **Members** | `DELETE /organizations/:orgSlug/members/:id` | Remover membro |
| **Invites** | `POST /organizations/:orgSlug/invites` | Enviar convite |
| **Invites** | `POST /invites/accept` | Aceitar convite (público) |
| **Account** | `GET /account/me` | Meus dados |
| **Account** | `PUT /account/me` | Atualizar meu perfil |
| **Account** | `PUT /account/password` | Trocar senha |
| **Account** | `GET /account/organizations` | Minhas organizações |

## Módulos Opt-in

| Módulo | Config | O que entrega |
|--------|--------|--------------|
| `auth` | `AuthFeatureConfig` | Login, register, refresh, recovery, verification, switch-org |
| `users` | `UsersFeatureConfig` | CRUD paginado de usuários |
| `organizations` | `OrganizationsFeatureConfig` | CRUD com slug auto-gerado, schema extensível |
| `profiles` | `ProfilesFeatureConfig` | Perfis de permissão por org, defaultProfiles |
| `members` | `MembersFeatureConfig` | Membros por org, RBAC, BkTenantResolver built-in |
| `invites` | `InvitesFeatureConfig` | Convites por email com token + TTL |
| `account` | `AccountFeatureConfig` | Meu perfil, troca de senha, minhas orgs |

## Personalização

### Campos extras no schema

```typescript
BackendKitModule.forRoot({
  organizations: {
    extraFields: { phone: String, cnpj: { type: String, index: true } },
  },
  auth: {
    userExtraFields: { company: String, role: String },
  },
})
```

### Callbacks de lifecycle

```typescript
BackendKitModule.forRoot({
  auth: {
    onAfterRegister: async (user) => await mailer.welcome(user.email),
    onPasswordRecovery: async (email, code) => await mailer.recovery(email, code),
  },
  members: {
    onMemberAdded: async (orgId, userId) => await notifier.memberJoined(orgId, userId),
  },
  invites: {
    onSendInvite: async (invite) => await mailer.invite(invite),
    onInviteAccepted: async (invite, user) => await notifier.accepted(invite),
  },
})
```

### Controller substituível

```typescript
BackendKitModule.forRoot({
  auth: { customController: MyCustomAuthController },
  users: { customController: MyCustomUsersController },
})
```

### Mensagens de erro customizáveis

```typescript
BackendKitModule.forRoot({
  auth: {
    messages: {
      invalidCredentials: 'Invalid email or password',
      accountNotVerified: 'Please verify your email first',
      emailAlreadyExists: 'This email is already registered',
    },
  },
})
```

### Perfis predefinidos

```typescript
BackendKitModule.forRoot({
  profiles: {
    defaultProfiles: [
      { name: 'Owner', roles: ['*'] },
      { name: 'Admin', roles: ['users.manage', 'tickets.manage'] },
      { name: 'Member', roles: ['tickets.view', 'tickets.create'] },
    ],
  },
})
```

---

## Compatibilidade

- **Node.js** >= 18.0.0
- **NestJS** 10.x ou 11.x
- **Mongoose** 8.x
- **TypeScript** >= 5.4

## Licença

Distribuído sob a licença **MIT**.

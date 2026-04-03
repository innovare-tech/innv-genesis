# Backend Kit Example API

Exemplo completo de API NestJS usando `@innv/nest-initializer` + `@innv/backend-kit`.

## Estrutura

```
src/
├── main.ts                    # Bootstrap com AppInitializer
├── app.module.ts              # Módulo raiz com BackendKitModule + TenantModule
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /api/v1/auth/login (público)
│   └── auth.service.ts        # Gera token JWT para testes
├── organizations/
│   ├── organizations.module.ts
│   ├── schemas/
│   │   └── organization.schema.ts
│   ├── repositories/
│   │   └── organizations.repository.ts  # extends BaseRepository
│   ├── services/
│   │   └── org-resolver.service.ts      # implements ITenantResolver
│   └── controllers/
│       └── organizations.controller.ts  # CRUD público (setup)
└── tickets/
    ├── tickets.module.ts
    ├── schemas/
    │   └── ticket.schema.ts
    ├── dtos/
    │   ├── create-ticket.dto.ts
    │   ├── update-ticket.dto.ts
    │   └── list-tickets-query.dto.ts    # extends SearchableQueryParamsDTO
    ├── exceptions/
    │   └── ticket-not-found.exception.ts # extends BusinessException
    ├── repositories/
    │   └── tickets.repository.ts        # extends BaseRepository
    ├── services/
    │   └── tickets.service.ts
    └── controllers/
        └── tickets.controller.ts        # @TenantController com CRUD completo
```

## Componentes do kit demonstrados

| Componente | Onde é usado |
|------------|-------------|
| `AppInitializer` | `main.ts` — bootstrap fluente |
| `BackendKitModule.forRoot()` | `app.module.ts` — config JWT |
| `TenantModule.forRoot()` | `app.module.ts` — multi-tenancy |
| `ITenantResolver` | `org-resolver.service.ts` |
| `BaseRepository` | `organizations.repository.ts`, `tickets.repository.ts` |
| `@TenantController` | `tickets.controller.ts` |
| `@TenantContext` | `tickets.controller.ts` — extrai org do request |
| `@AuthenticatedUser` | `tickets.controller.ts` — extrai user do JWT |
| `@Roles` | `tickets.controller.ts` — autorização por permissão |
| `@Public` | `auth.controller.ts`, `organizations.controller.ts` |
| `JwtAuthGuard` | `main.ts` — guard global |
| `GlobalExceptionFilter` | `main.ts` — filtro global |
| `ResponseData` | `main.ts` — response mapper |
| `BusinessException` | `ticket-not-found.exception.ts` |
| `@HttpReturnCode` | `ticket-not-found.exception.ts` |
| `SearchableQueryParamsDTO` | `list-tickets-query.dto.ts` — herança |
| `PaginatedQueryResultDTO` | `tickets.controller.ts` — retorno tipado |

## Como rodar

### 1. Pré-requisitos

- Node.js >= 18
- MongoDB rodando em `localhost:27017`

### 2. Setup

```bash
# Na raiz do monorepo innv-genesis
pnpm install

# Copiar .env
cp packages/backend-kit/example/.env.example packages/backend-kit/example/.env

# Build dos packages
pnpm build
```

### 3. Iniciar

```bash
cd packages/backend-kit/example
pnpm start:dev
```

### 4. Testar

A API estará em `http://localhost:3000`. Swagger em `http://localhost:3000/docs`.

```bash
# 1. Criar uma organização (público)
curl -X POST http://localhost:3000/api/v1/organizations \
  -H "Content-Type: application/json" \
  -d '{"name": "Minha Org", "slug": "minha-org"}'

# 2. Fazer login (público) — recebe um JWT
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "123"}'
# Copie o accessToken da resposta

# 3. Criar ticket (autenticado + multi-tenant)
curl -X POST http://localhost:3000/api/v1/organizations/minha-org/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{"title": "Guincho para veículo quebrado", "description": "BR-101 km 42"}'

# 4. Listar tickets com paginação e busca
curl "http://localhost:3000/api/v1/organizations/minha-org/tickets?page=1&limit=10&search=guincho" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"

# 5. Contagem por status
curl http://localhost:3000/api/v1/organizations/minha-org/tickets/status-counts \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

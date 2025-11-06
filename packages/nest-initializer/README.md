# @innv/nest-initializer 🚀

[![NPM Version](https://img.shields.io/npm/v/@innv/nest-initializer?style=flat-square)](https://www.npmjs.com/package/@innv/nest-initializer)
[![CI Status](https://img.shields.io/github/actions/workflow/status/innovare-tech/nest-initializer/ci.yml?branch=main)](https://github.com/innovare-tech/nest-initializer/actions/workflows/ci.yml)
[![Test Coverage](https://codecov.io/gh/innovare-tech/nest-initializer/graph/badge.svg?token=AO4URNQ042)](https://codecov.io/gh/innovare-tech/nest-initializer)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

> **Uma plataforma fluente, opinativa e "estilo Spring Boot" para inicializar e configurar suas aplicações NestJS com as melhores práticas.**

Diga adeus ao boilerplate repetitivo no `main.ts` e `AppModule`!  
`@innv/nest-initializer` oferece uma **API Builder elegante** para configurar tudo — desde validação de variáveis de ambiente até auto-discovery de componentes e observabilidade pronta para produção.

---

## ✨ Por que usar `@innv/nest-initializer`?

- **API Fluente e Declarativa:** Configure sua aplicação de forma encadeada e legível no `main.ts`.
- **Convenção sobre Configuração:** Starters inteligentes para TypeORM, Mongoose e Cache que se auto-configuram.
- **Configuração Segura (Fail-Fast):** Valide variáveis de ambiente com `class-validator`. Sem mais erros em runtime!
- **Auto-Discovery ("Component Scanning"):** Detecta e registra automaticamente `@Injectable()` e `@Controller()`.
- **Produção Pronta por Padrão:**
  - Presets para desenvolvimento e produção (`useDevelopmentDefaults`, `useProductionDefaults`);
  - Helmet, Compressão, Graceful Shutdown e Métricas Prometheus (`.withMetrics`);
  - Health Checks (`.withHealthCheck`).
- **Extensível:** Sistema de Plugins (`.withPlugin`) para lógicas customizadas.
- **Flexível:** Suporte nativo a Express e Fastify.

---

## 📦 Instalação

```bash
# Com pnpm (recomendado)
pnpm add @innv/nest-initializer @nestjs/config class-validator class-transformer reflect-metadata
pnpm add -D @types/compression @types/helmet

# Com npm
npm install @innv/nest-initializer @nestjs/config class-validator class-transformer reflect-metadata
npm install --save-dev @types/compression @types/helmet

# Com yarn
yarn add @innv/nest-initializer @nestjs/config class-validator class-transformer reflect-metadata
yarn add --dev @types/compression @types/helmet
```

> ⚠️ **Importante:**  
> Esta biblioteca utiliza `peerDependencies`.  
> Certifique-se de que seu projeto já possui as dependências principais do NestJS (`@nestjs/common`, `@nestjs/core`, `rxjs`) e as específicas das features que ativar (ex: `@nestjs/typeorm`, `typeorm` se usar `.withTypeOrm()`).  
> Veja o `package.json` para a lista completa.

---

## 🚀 Quick Start (Exemplo Completo)

### 1️⃣ Defina seu Schema de Configuração

`src/config/env.schema.ts`:

```ts
import { IsString, IsInt, IsNotEmpty, Min, Max } from 'class-validator';

export class EnvironmentVariables {
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  @IsNotEmpty()
  DATABASE_URL: string; // Ex: postgresql://user:pass@host:5432/db

  @IsString()
  @IsNotEmpty()
  REDIS_URL: string; // Ex: redis://localhost:6379
}
```

---

### 2️⃣ Configure seu `main.ts`

```ts
// src/main.ts
import 'reflect-metadata';
import { AppModule } from './app/app.module';
import { AppInitializer } from '@innv/nest-initializer';
import { EnvironmentVariables } from './config/env.schema';
import { VersioningType } from '@nestjs/common';

async function bootstrap() {
  const isDevelopment = process.env.NODE_ENV !== 'production';

  await AppInitializer.bootstrap(AppModule, async (app) => {
    app
      .withValidatedConfig(EnvironmentVariables)
      .withTypeOrm({
        autoLoadEntities: true,
        runMigrationsOnStartup: isDevelopment,
      })
      .withCaching({ defaultTtlInSeconds: 600 })
      .withAutoDiscovery({ basePath: __dirname })
      .withValidationPipe()
      .withClassSerializer()
      .withHealthCheck({ database: true, memory: true })
      .withMetrics()
      .onPort(parseInt(process.env.PORT || '3000', 10))
      .withGlobalPrefix('/api')
      .withVersioning({ type: VersioningType.URI, prefix: 'v' })
      .withCors({ origin: '*' })

      .when(isDevelopment, (builder) => {
        builder.useDevelopmentDefaults({
          title: 'API (Dev)',
          description: 'Documentação da API',
          version: '1.0.0',
        });
      })
      .when(!isDevelopment, (builder) => {
        builder.useProductionDefaults();
      });

    // Exemplos extras:
    // .useGlobalGuard(JwtAuthGuard)
    // .withPlugin(new MyCustomPlugin())
  });
}

void bootstrap();
```

Pronto! Sua aplicação NestJS está configurada com **validação, banco, cache, observabilidade, métricas e auto-discovery** — tudo de forma fluente.

---

## ⚙️ Uso Detalhado

### 🔧 Configuração Core

| Método                                              | Descrição                       |
| --------------------------------------------------- | ------------------------------- |
| `AppInitializer.bootstrap(AppModule, configurator)` | Ponto de entrada principal.     |
| `onPort(port)`                                      | Define a porta.                 |
| `withGlobalPrefix(prefix)`                          | Prefixo global para rotas.      |
| `withVersioning(options)`                           | Configura versionamento de API. |
| `withCors(options)`                                 | Habilita CORS.                  |

---

### 🧩 Configuração e Validação

`withValidatedConfig<T>(schema: Type<T>)`  
Valida `.env` e injeta `ConfigModule` globalmente.  
A aplicação **falha na inicialização** se a validação falhar.

---

### ⚡ Starters (Auto-Configuração)

- `withTypeOrm(options)`
- `withMongoose(options)`
- `withCaching(options)`

Todos configuram seus módulos respectivos (`TypeOrmModule`, `MongooseModule`, `CacheModule`) automaticamente com `ConfigService`.

---

### 🔍 Descoberta de Componentes

`withAutoDiscovery({ basePath })`  
Varre o diretório e registra automaticamente:

- `@Injectable()` como providers
- `@Controller()` como controllers

Ignora `*.module.*`, `*.spec.*`, `node_modules`, `features`, `plugins`.

---

### 🧱 Pipeline Global

| Método                              | Função                              |
| ----------------------------------- | ----------------------------------- |
| `withValidationPipe()`              | Registra `ValidationPipe` global.   |
| `useGlobalPipe(pipe)`               | Pipe customizado global.            |
| `useGlobalFilter(filter)`           | Filtro de exceção global.           |
| `useGlobalGuard(guard)`             | Guard global.                       |
| `useGlobalInterceptor(interceptor)` | Interceptor global.                 |
| `withClassSerializer()`             | Ativa `ClassSerializerInterceptor`. |

---

### 🩺 Observabilidade ("Actuator")

| Método                     | Descrição                                          |
| -------------------------- | -------------------------------------------------- |
| `withHealthCheck(options)` | Cria endpoint `/health` usando `@nestjs/terminus`. |
| `withMetrics()`            | Cria endpoint `/metrics` no formato Prometheus.    |

Suporte nativo a métricas HTTP (latência, contadores, etc).

---

### 🧰 Middlewares e Hooks

| Método                   | Ação                                |
| ------------------------ | ----------------------------------- |
| `withGracefulShutdown()` | Habilita `enableShutdownHooks()`.   |
| `useHelmet()`            | Adiciona `helmet()` para segurança. |
| `enableCompression()`    | Adiciona `compression()` para gzip. |

---

### 📘 Swagger (OpenAPI)

| Método                    | Descrição                       |
| ------------------------- | ------------------------------- |
| `withSwagger(options)`    | Configura documentação Swagger. |
| `withAdvancedSwaggerUI()` | Tema escuro e UI aprimorada.    |

---

### 🧩 Extensibilidade

| Método                | Descrição                      |
| --------------------- | ------------------------------ |
| `withPlugin(plugin)`  | Adiciona plugins customizados. |
| `when(condition, fn)` | Executa blocos condicionais.   |

---

### 🪄 Presets

| Método                                   | Descrição                                                |
| ---------------------------------------- | -------------------------------------------------------- |
| `useDevelopmentDefaults(swaggerOptions)` | Atalho para Swagger + Logger.                            |
| `useProductionDefaults()`                | Atalho para Helmet, Compression, Shutdown e RateLimiter. |

---

## 💡 Filosofia

`@innv/nest-initializer` traz a **produtividade e convenções inteligentes do Spring Boot** para o NestJS, mantendo a flexibilidade e o poder da plataforma.  
O foco é **reduzir boilerplate e aumentar a consistência** entre projetos NestJS, permitindo que times foquem no que realmente importa: **a lógica de negócio.**

---

## 🤝 Contribuição

Contribuições são bem-vindas!  
Abra uma **Issue** ou **Pull Request** no repositório:

👉 [https://github.com/innovare-tech/nest-initializer](https://github.com/innovare-tech/nest-initializer)

---

## 📜 Licença

Distribuído sob a licença **MIT**.  
Veja o arquivo [LICENSE](./LICENSE) para mais informações.

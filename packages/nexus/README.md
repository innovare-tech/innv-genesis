# @innv/nexus

Cliente HTTP declarativo, type-safe e com tratamento de erro explícito para NestJS, parte do ecossistema **innv-genesis**.

`@innv/nexus` transforma a maneira como você consome APIs externas em uma aplicação NestJS. Em vez de injetar `HttpService` e construir requisições manualmente, você define uma interface abstrata com decorators, e o Nexus cuida de toda a implementação, validação e tratamento de erro para você.

---

## 🚀 Core Features

✨ **Totalmente Declarativo**: Defina suas APIs usando decorators (`@ApiClient`, `@Get`, `@Post`, `@Path`, `@Body`, etc.).

🛡️ **Type-Safe de Ponta a Ponta**: Retorna um tipo `Result<T, E>`, forçando você a tratar explicitamente os casos de sucesso (`Ok<T>`) e de erro (`Err<E>`).

🤖 **Validação Automática**: Valida automaticamente DTOs de erro (via `@ErrorResponse`) usando `class-validator`, garantindo que até seus erros sejam type-safe.

⚙️ **Integrado ao NestJS**: Integra-se perfeitamente com o `ConfigService` do NestJS para resolver URLs base, timeouts e mais a partir de variáveis de ambiente.

🔍 **Auto-Discovery**: Quando usado com `@innv/nest-initializer`, seus clientes de API são descobertos e registrados automaticamente na injeção de dependência.

---

## 📦 Instalação

```bash
# Usando pnpm (recomendado)
pnpm add @innv/nexus reflect-metadata

# Usando npm
npm install @innv/nexus reflect-metadata

# Usando yarn
yarn add @innv/nexus reflect-metadata
```

### Peer Dependencies

O `@innv/nexus` requer que você tenha as seguintes bibliotecas em seu projeto:

- `@nestjs/common`
- `@nestjs/core`
- `reflect-metadata`

Se você planeja usar a resolução de configuração via variáveis de ambiente (recomendado), você também precisará:

- `@nestjs/config`

---

## ⚙️ Configuração (Setup)

Importe o `NexusModule` no seu módulo raiz (ex: `AppModule`) para prover os serviços internos que o Nexus utiliza.

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NexusModule } from '@innv/nexus';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NexusModule],
})
export class AppModule {}
```

---

## 🧠 Guia de Uso Completo

### Passo 1: Definir os DTOs

```typescript
// src/users/dtos/user.dto.ts
import { Expose } from 'class-transformer';
import { IsInt, IsString, IsEmail } from 'class-validator';

export class UserDto {
  @Expose() @IsInt() id!: number;
  @Expose() @IsString() name!: string;
  @Expose() @IsEmail() email!: string;
}
```

```typescript
// src/users/dtos/user-api-error.dto.ts
import { Expose } from 'class-transformer';
import { IsString, IsArray } from 'class-validator';

export class NotFoundErrorDto {
  @Expose() @IsString() message!: string;
  @Expose() @IsString() errorCode: string = 'NOT_FOUND';
}

export class ValidationErrorDto {
  @Expose() @IsString() message: string = 'Validation Failed';
  @Expose() @IsArray() @IsString({ each: true }) fields!: string[];
}
```

### Passo 2: Definir a Interface do Cliente

```typescript
// src/users/users.client.ts
import { ApiClient, Get, Post, Path, Query, Body, Header, ErrorResponse, Result } from '@innv/nexus';
import { UserDto } from './dtos/user.dto';
import { NotFoundErrorDto, ValidationErrorDto } from './dtos/user-api-error.dto';

@ApiClient({ baseUrlEnvKey: 'USERS_API_URL', timeoutEnvKey: 'USERS_API_TIMEOUT' })
export abstract class UsersApiClient {
  @Get('/users/:id')
  @ErrorResponse(404, NotFoundErrorDto)
  getUserById(
    @Path('id') id: number,
    @Query('includeDetails') details?: boolean,
    @Header('X-Tenant-Id') tenantId?: string,
  ): Promise<Result<UserDto, NotFoundErrorDto>>;

  @Post('/users')
  @ErrorResponse(400, ValidationErrorDto)
  createUser(@Body() user: Omit<UserDto, 'id'>): Promise<Result<UserDto, ValidationErrorDto>>;
}
```

### Passo 3: Registrar o Cliente

#### Opção A: Registro Automático (Recomendado)

```typescript
await AppInitializer.bootstrap(AppModule, (app) => {
  app.withAutoDiscovery({ basePath: __dirname });
});
```

#### Opção B: Registro Manual

```typescript
// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { createNexusClientProvider } from '@innv/nexus';
import { UsersApiClient } from './users.client';
import { UsersService } from './users.service';

@Module({
  providers: [UsersService, createNexusClientProvider(UsersApiClient)],
  exports: [UsersService],
})
export class UsersModule {}
```

### Passo 4: Usar o Cliente em um Serviço

```typescript
// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersApiClient } from './users.client';
import { UserDto } from './dtos/user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersApi: UsersApiClient) {}

  async findUser(id: number): Promise<UserDto> {
    const result = await this.usersApi.getUserById(id);
    if (result.isOk) return result.value;
    throw new NotFoundException(result.error.message);
  }
}
```

---

## 🧩 Referência da API (Decorators)

### `@ApiClient(options: ApiClientOptions)`

Define um cliente HTTP.  
**Opções:**

| Opção         | Tipo                   | Obrigatório            | Descrição                               |
| :------------ | :--------------------- | :--------------------- | :-------------------------------------- |
| baseUrl       | string                 | Sim (ou baseUrlEnvKey) | URL base da API                         |
| baseUrlEnvKey | string                 | Sim (ou baseUrl)       | Chave de ambiente para URL              |
| timeout       | number                 | Não                    | Timeout fixo (ms)                       |
| timeoutEnvKey | string                 | Não                    | Timeout via variável de ambiente        |
| staticHeaders | Record<string, string> | Não                    | Headers fixos para todas as requisições |

### Decorators de Método

- `@Get(path: string)`
- `@Post(path: string)`
- `@Put(path: string)`
- `@Patch(path: string)`
- `@Delete(path: string)`

### Decorators de Parâmetro

- `@Path(name: string)`
- `@Query(name: string)`
- `@Body()`
- `@Header(name: string)`

### Decorator de Erro

- `@ErrorResponse(status: number, dto: Type<any>)`

---

## 📜 Licença

Distribuído sob a licença **MIT**. Veja o arquivo `LICENSE` para mais informações.

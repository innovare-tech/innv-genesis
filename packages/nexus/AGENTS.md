# @innv/nexus — TypeScript (cliente HTTP declarativo)

Pacote compartilhado — provê: **nexus**. Cliente HTTP declarativo e type-safe para NestJS (sobre axios + class-transformer/validator). Base do `nest-initializer`. Peer: `@nestjs/common` + `@nestjs/config`.

## Monorepo
- Parte do monorepo **innv-genesis** (pnpm; `directory: packages/nexus`). Publicado no **GitHub Packages** (`@innv/nexus`).

## Dev
- Instalar (raiz do monorepo): `pnpm install`
- Build: `pnpm build` (`rimraf dist && tsc`). Dev watch: `pnpm dev`. Testar: `pnpm test` (jest).

## Layout
- `src/` (client declarativo, decorators), saída `dist/index.js` + `.d.ts`.

## Dependências internas
- Nenhuma (é base do `nest-initializer`).

## Nunca
- Editar `dist/`, `node_modules/`.

## Pronto = `pnpm build` OK + `pnpm test` verde.

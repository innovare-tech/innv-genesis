# @innovare-tech/backend-kit — TypeScript (toolkit NestJS)

Pacote compartilhado — provê: **backend-kit**. Toolkit opinativa para backends NestJS: repositórios, exceções, guards, decorators, paginação e multi-tenancy. Consumido por unic-core, bolão, verba, tessera. Node >=18.

## Monorepo
- Parte do monorepo **innv-genesis** (pnpm workspace; repo `git@github.com:innovare-tech/innv-genesis.git`, `directory: packages/backend-kit`). Publicado no **GitHub Packages** (`@innovare-tech/backend-kit`).

## Dev
- Instalar (na raiz do monorepo): `pnpm install`
- Build: `pnpm build` (gera `dist/cjs` + `dist/esm` + `dist/types` via tsc). Testar: `pnpm test` (jest).

## Layout
- `src/` (repos/exceptions/guards/decorators/pagination/multi-tenancy), barrel `src/index.ts`. Saída dual CJS/ESM + `.d.ts`.

## Dependências internas
- Nenhuma (é base). Consumidores fixam a versão publicada.

## Nunca
- Editar `dist/`, `node_modules/`. Fazer breaking change sem bump de versão (raio grande → skill `cross-repo-impact`).

## Pronto = `pnpm build` OK + `pnpm test` verde.

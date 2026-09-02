# @innv/nest-initializer — TypeScript (bootstrap NestJS)

Pacote compartilhado — provê: **nest-bootstrap**. Plataforma fluente e opinativa para inicializar/configurar apps NestJS com as boas práticas. Consumido pela maioria dos backends (unic-core, bolão, verba, tessera). Node >=18.

## Monorepo
- Parte do monorepo **innv-genesis** (pnpm; `directory: packages/nest-initializer`). Publicado no **GitHub Packages** (`@innv/nest-initializer`).

## Dev
- Instalar (raiz do monorepo): `pnpm install`
- Build: `pnpm build` (CJS+ESM+types). Testar: `pnpm test` (jest).

## Layout
- `src/` (API fluente de bootstrap), barrel `src/index.ts`.

## Dependências internas
- Consome: `nexus` (mesmo monorepo, workspace). Pra inspecionar → skill `resolve-dependency-source`.

## Nunca
- Editar `dist/`, `node_modules/`. Breaking change sem bump (raio grande → `cross-repo-impact`).

## Pronto = `pnpm build` OK + `pnpm test` verde.

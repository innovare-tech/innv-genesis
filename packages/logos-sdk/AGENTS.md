# @innv/logos-sdk — TypeScript (SDK do Logos)

Pacote compartilhado — provê: **logos-client**. SDK NestJS para integração com o Logos Engine (chatbot conversacional SaaS). Consumido pelo `ms-innv-unic-core`. Node >=18.

## Monorepo
- Parte do monorepo **innv-genesis** (pnpm; `directory: packages/logos-sdk`). Publicado no **GitHub Packages** (`@innv/logos-sdk`).

## Dev
- Instalar (raiz do monorepo): `pnpm install`
- Build: `pnpm build` (CJS+ESM+types). Testar: `pnpm test` (jest).

## Layout
- `src/` (client/tipos p/ o Logos Engine), barrel `src/index.ts`. Segue o contrato do `ms-innv-logos-engine`.

## Dependências internas
- Nenhuma no grafo (é SDK-folha).

## Nunca
- Editar `dist/`, `node_modules/`. Divergir do contrato do Logos Engine sem bump.

## Pronto = `pnpm build` OK + `pnpm test` verde.

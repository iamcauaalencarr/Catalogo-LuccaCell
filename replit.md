# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## User preferences & AGENT MANDATORY RULES

- **GitHub Issue & PR Workflow (Obrigatório)**:
  - NENHUMA alteração (Correção, Melhoria ou Nova Função) deve ser feita sem que uma **Issue no GitHub** tenha sido criada primeiro.
  - TODO deploy e alteração deve obrigatoriamente ser gerenciado via **Pull Request (PR)**.
  - A descrição do PR DEVE obrigatoriamente referenciar a Issue criada (ex: `Closes #123` ou `Fixes #45`).
  - Qualquer agente AI (qualquer modelo) DEVE ler `CONTRIBUTING.md` e seguir estritamente este padrão.

- **Motion Principles (Design Principles)**:
  - Toda e qualquer interface DEVE ter esqueletos (Skeleton Loaders), Lazy Loading de componentes/imagens, animações suaves de Entrada, Saída, Carregamento e Progresso em TODOS os elementos.

- **Observabilidade, Qualidade & Testes**:
  - Toda aplicação deve conter suporte à Observabilidade (Sentry, Datadog, NewRelic, OpenTelemetry), Qualidade (Biome, Arch-contract, Commitlint, Knip, Stryker) e Testes (Vitest, Playwright, Codecov).

## Gotchas

- Sempre verifique a existência de Issues antes de iniciar tarefas.
- Nunca faça commits diretos em `main`/`master` — utilize sempre branches e PRs.

## Pointers

- Veja [CONTRIBUTING.md](file:///c:/Users/lucca/OneDrive/Desktop/Catalogo-Lucca%20Cell/CONTRIBUTING.md) para detalhes de contribuição e governança.
- Veja `.github/PULL_REQUEST_TEMPLATE.md` para criar PRs no padrão correto.


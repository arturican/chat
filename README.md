# PulseChat

PulseChat is a production-minded realtime messenger being built as a TypeScript monorepo.

## Current Repository State

The repository is no longer an empty starter pack.

Implemented now:

- pnpm workspace monorepo
- `apps/web` with Next.js App Router bootstrap
- `apps/api` with NestJS + Fastify bootstrap
- `packages/contracts` with shared HTTP and WebSocket contract types
- Docker Compose for PostgreSQL and MinIO
- shared TypeScript, ESLint, Prettier, Husky, and lint-staged setup
- root `pnpm dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e` scripts
- `GET /api/health`

Not implemented yet:

- Prisma schema and database client
- auth flow
- chats
- messages history
- realtime gateway
- uploads flow
- search

## Repository Structure

```txt
.
├─ apps/
│  ├─ api/
│  └─ web/
├─ packages/
│  └─ contracts/
├─ docker/
│  └─ minio/
├─ docs/
├─ prompts/
├─ tasks/
├─ AGENTS.md
├─ docker-compose.yml
├─ package.json
├─ pnpm-workspace.yaml
├─ prettier.config.mjs
├─ eslint.config.mjs
└─ tsconfig.base.json
```

## Local Setup

Install dependencies:

```bash
pnpm install
```

Start local infrastructure:

```bash
docker compose up -d
```

Run both apps together:

```bash
set -a
. apps/api/.env.example
. apps/web/.env.example
set +a
pnpm dev
```

## Verification Commands

Project-wide checks:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Manual checks:

```bash
curl http://127.0.0.1:4000/api/health
open http://127.0.0.1:3000
```

Expected bootstrap result:

- web shell is available on `http://127.0.0.1:3000`
- api health endpoint responds on `http://127.0.0.1:4000/api/health`
- PostgreSQL is exposed on `localhost:5432`
- MinIO is exposed on `localhost:9000` and `localhost:9001`

## Current Development Policy

- Follow `AGENTS.md` first.
- Follow `docs/08-implementation-plan.md` for phase order.
- Work in small finished steps.
- Make one git commit per completed step.
- Push only when the user explicitly asks.

## Current Next Phase

The next implementation target is **Phase 1 — auth**.

Recommended first auth sub-step:

1. Add Prisma schema for `users`, `profiles`, and `sessions`.
2. Wire Prisma into `apps/api`.
3. Only then build register/login/refresh/logout.

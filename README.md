# PulseChat

PulseChat is a production-minded realtime messenger being built as a TypeScript monorepo.

## Current Repository State

The repository is no longer an empty starter pack.

Implemented now:

- pnpm workspace monorepo
- `apps/web` with Next.js App Router auth routes and protected app shell
- `apps/api` with NestJS + Fastify bootstrap plus auth API
- `packages/contracts` with shared HTTP and WebSocket contract types
- Prisma schema, migration, and generated database client for `users`, `profiles`, `sessions`
- register / login / refresh / logout / me auth flow
- httpOnly refresh cookie + in-memory access token strategy
- backend auth integration tests
- Docker Compose for PostgreSQL and MinIO
- shared TypeScript, ESLint, Prettier, Husky, and lint-staged setup
- root `pnpm dev`, `build`, `lint`, `typecheck`, `test`, `test:e2e` scripts
- `GET /api/health`

Not implemented yet:

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

Apply database migrations:

```bash
set -a
. apps/api/.env.example
set +a
pnpm --filter @pulsechat/api prisma:migrate:deploy
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
open http://127.0.0.1:3000/login
```

Expected auth-phase result:

- register and login pages are available on `http://127.0.0.1:3000/login` and `http://127.0.0.1:3000/register`
- the root route `/` redirects into the protected shell only after refresh + `GET /api/me`
- auth endpoints respond on `http://127.0.0.1:4000/api/auth/*`
- api health endpoint still responds on `http://127.0.0.1:4000/api/health`
- PostgreSQL is exposed on `localhost:5432`
- MinIO is exposed on `localhost:9000` and `localhost:9001`

Manual auth smoke via API:

```bash
curl -i -c /tmp/pulsechat.cookie \
  -H 'content-type: application/json' \
  -d '{"email":"demo@example.com","password":"supersecret1","username":"demo_user"}' \
  http://127.0.0.1:4000/api/auth/register

curl -i -b /tmp/pulsechat.cookie -X POST http://127.0.0.1:4000/api/auth/refresh
```

## Current Development Policy

- Follow `AGENTS.md` first.
- Follow `docs/08-implementation-plan.md` for phase order.
- Work in small finished steps.
- Make one git commit per completed step.
- Push only when the user explicitly asks.

## Current Next Phase

The next implementation target is **Phase 2 — chats**.

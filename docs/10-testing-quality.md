# Testing & Quality — PulseChat

## Current Quality Baseline

What is already verified in the repository:

- root `pnpm build` passes
- root `pnpm lint` passes
- root `pnpm typecheck` passes
- root `pnpm test` and `pnpm test:e2e` exist and currently no-op cleanly
- web bootstrap builds successfully
- api bootstrap builds successfully
- `/api/health` responds successfully
- Docker Compose starts PostgreSQL and MinIO locally

## What Is Not In Place Yet

There are currently no real:

- unit tests
- integration tests
- e2e tests
- Prisma tests
- websocket tests

That is acceptable for the current bootstrap phase, but not for later feature phases.

## Required Quality Direction

As real features appear, coverage should grow in this order:

### Auth

- validation cases
- session lifecycle
- refresh flow
- protected route behavior

### Chats and messages

- access control
- pagination behavior
- message mapping
- CRUD edge cases

### Realtime

- happy-path gateway behavior
- idempotency by `clientId`
- reconnect behavior

## Definition Of Done For Future Steps

A feature step is complete when:

- code is implemented
- types are correct
- build passes
- lint passes
- typecheck passes
- happy path works
- obvious edge cases are handled
- documentation or verification command is provided
- one dedicated git commit is created for that finished step

## Current Recommended Check Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
docker compose up -d
curl http://127.0.0.1:4000/api/health
```

# PulseChat

PulseChat is a production-minded realtime web messenger built as a pnpm workspace monorepo.

## Current Status

- Phase 0 (bootstrap) is completed.
- The next implementation phase is Phase 1 (auth).
- The repository already contains:
  - `apps/web` on Next.js App Router
  - `apps/api` on NestJS + Fastify
  - `packages/contracts` for shared DTO and ws protocol types
  - `docker-compose.yml` for PostgreSQL and MinIO
  - shared TypeScript, ESLint, and Prettier setup

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
└─ tsconfig.base.json
```

## Local Commands

Install dependencies:

```bash
pnpm install
```

Start local infrastructure:

```bash
docker compose up -d
```

Run web and api together:

```bash
set -a
. apps/api/.env.example
. apps/web/.env.example
set +a
pnpm dev
```

Project-wide checks:

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Bootstrap Verification

When Phase 0 is healthy:

- `pnpm build` passes
- `pnpm lint` passes
- `pnpm typecheck` passes
- `docker compose up -d` starts PostgreSQL and MinIO
- `GET http://127.0.0.1:4000/api/health` returns `200`
- `http://127.0.0.1:3000` serves the web shell

## Working Rules

- Read `AGENTS.md` before making architectural changes.
- Use `docs/08-implementation-plan.md` as the phase roadmap.
- Use `tasks/` as the execution checklist for the current phase.
- Make one logical step at a time.
- Create one git commit per finished step.
- Push only on explicit request.

## Codex And GitHub

This repository already has a Git remote configured for GitHub and is ready for normal `git push` / `git pull` workflows from the local Codex app.

Codex web / ChatGPT GitHub access is a separate OpenAI product integration. According to OpenAI Help Center guidance, GitHub is connected through ChatGPT settings:

1. Open ChatGPT.
2. Go to `Settings -> Apps`.
3. Choose GitHub.
4. Authorize the ChatGPT app in GitHub and select the repositories it may access.

Sources:

- [Using Codex with your ChatGPT plan](https://help.openai.com/en/articles/11369540/)
- [Connecting GitHub to ChatGPT](https://help.openai.com/en/articles/11145903-connecting-github-to-chatgpt)

# Task 001 — Bootstrap

## Статус

Завершено.

## Что уже реализовано

- pnpm workspace config
- base TypeScript config
- shared ESLint / Prettier config
- `apps/web` с Next.js App Router shell
- `apps/api` с NestJS + Fastify bootstrap
- `packages/contracts`
- Docker Compose для PostgreSQL и MinIO
- `.env.example` для web/api
- root scripts
- `GET /api/health`
- базовая landing shell page в web

## Acceptance Criteria

Уже подтверждено:

- `pnpm install` работает
- `pnpm dev` поднимает web и api
- `docker compose up -d` поднимает postgres и minio
- `/api/health` отвечает `200`
- web страница открывается

## Следующий Task

Следующий рабочий task: `tasks/002-auth.md`

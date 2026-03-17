# Task 001 — Bootstrap

## Статус

Завершено.

## Цель

Поднять монорепу и локальную инфраструктуру.

## Нужно сделать

- pnpm workspace config
- base tsconfig
- shared eslint/prettier config
- `apps/web` с Next.js App Router
- `apps/api` с NestJS + Fastify
- `packages/contracts`
- Docker Compose:
  - postgres
  - minio
- `.env.example` для web/api
- root scripts
- basic health endpoint
- basic landing shell page in web

## Acceptance criteria

- `pnpm install` работает
- `pnpm dev` поднимает web и api
- `docker compose up -d` поднимает postgres и minio
- `/api/health` отвечает 200
- web страница открывается

## Примечание

Этот task уже закрыт в репозитории. Следующий рабочий task — `tasks/002-auth.md`.

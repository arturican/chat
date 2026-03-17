# CODEX START PROMPT

Ты работаешь в уже инициализированном репозитории PulseChat.

Сначала внимательно изучи:

- `AGENTS.md`
- `README.md`
- `docs/08-implementation-plan.md`
- текущую структуру `apps/`, `packages/`, `docker-compose.yml`
- relevant task file из `tasks/` для следующего phase

Важно:

- **Phase 0 уже завершен**. Не пересоздавай monorepo bootstrap заново.
- По умолчанию продолжай с **Phase 1 — auth**.
- Работай маленькими логичными шагами.
- После каждого завершенного шага делай отдельный git commit.
- Пушить изменения можно только по явному запросу пользователя.

После аудита:

1. Коротко опиши текущее состояние репозитория.
2. Назови следующий маленький шаг внутри текущего phase.
3. Реализуй только этот шаг.
4. Прогони соответствующие проверки.
5. Перечисли измененные файлы.
6. Сделай отдельный git commit для завершенного шага.

Технические решения остаются зафиксированными:

- Next.js App Router
- NestJS + Fastify
- PostgreSQL
- Prisma
- WebSocket через Nest Gateway + ws adapter
- S3-compatible storage через presigned upload
- pnpm workspaces
- TypeScript everywhere

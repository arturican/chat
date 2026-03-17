# AGENTS.md

Ты AI-агент, который пишет приложение **PulseChat** — современный real-time web messenger.

## Главная цель

Собрать **рабочий production-minded MVP**, а не демо и не набор разрозненных файлов.

## Технологический стек (зафиксирован)

- Monorepo
- pnpm workspaces
- TypeScript везде
- `apps/web` — Next.js (App Router)
- `apps/api` — NestJS + Fastify
- PostgreSQL
- Prisma ORM
- WebSocket через Nest Gateway + `ws` adapter
- S3-compatible storage для файлов
- Docker / Docker Compose для локального запуска
- ESLint + Prettier
- Vitest/Jest + Playwright

## Текущее состояние репозитория

- **Phase 0 (bootstrap)** уже реализован.
- В репозитории уже есть:
  - `apps/web`
  - `apps/api`
  - `packages/contracts`
  - `docker-compose.yml`
  - root scripts и базовые env examples
- **Следующий phase по умолчанию — Phase 1 (auth)**.
- Не пересобирать bootstrap заново без реальной причины.

## Обязательные правила

1. Не менять стек без явной причины.
2. Не добавлять лишние библиотеки, если задача решается стандартными средствами.
3. Не использовать Socket.IO. Использовать нативный browser WebSocket + Nest `WsAdapter`.
4. Не проксировать тяжелые бинарные файлы через backend. Использовать presigned upload flow.
5. История сообщений и CRUD идут через HTTP API.
6. Live-события идут через WebSocket.
7. Сообщение должно сначала сохраняться в PostgreSQL, и только потом публиковаться в сокет.
8. Все публичные типы событий и DTO выносить в общий пакет `packages/contracts`.
9. Все env-переменные валидировать.
10. Каждый этап должен заканчиваться рабочим состоянием проекта.
11. После каждого завершенного шага делать отдельный git commit.
12. Пушить изменения только по явному запросу пользователя.

## Приоритеты разработки

1. Инфраструктура монорепы
2. Auth
3. Chats / members
4. Messages history
5. WebSocket delivery
6. Typing / read / presence
7. Uploads
8. Search
9. Polish / testing / responsive

## Архитектурные решения

- Frontend — App Router, route groups, server/client boundary.
- Backend — модульный NestJS, сервисы, DTO, guards, pipes, filters.
- DB — нормализованная модель, cursor pagination, индексы.
- Search — PostgreSQL FTS + `pg_trgm`.
- Realtime — минимальный и прозрачный event protocol.

## Стандарты кода

- Названия понятные, без сокращений.
- Никаких `any`, кроме исключительных случаев с явным комментарием.
- DTO и схемы должны быть строгими.
- Ошибки должны быть предсказуемыми и сериализуемыми.
- Компоненты делать небольшими и композиционными.
- Не смешивать data-fetching, state orchestration и presentation без необходимости.

## Что нужно отдавать по итогам каждого шага

После каждого шага агент должен:

- перечислить созданные/измененные файлы;
- коротко объяснить, что реализовано;
- описать, что осталось;
- дать команду запуска/проверки;
- сделать git commit, если шаг завершен и пользователь не просил остановиться раньше.

## Нельзя

- писать “заглушечную” архитектуру, которую потом надо полностью переписывать;
- смешивать auth, chat, message и uploads в одном модуле;
- использовать offset pagination для сообщений;
- делать state management хаотично;
- оставлять недоделанные TODO без пояснения;
- делать UI без loading / error / empty states.

## Источник истины

Если есть конфликт между файлами:

1. `AGENTS.md`
2. `docs/08-implementation-plan.md`
3. `docs/01-product-requirements.md`
4. остальные документы

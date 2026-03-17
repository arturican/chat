# Implementation Plan — PulseChat

## Current Checkpoint

- **Phase 0 — bootstrap:** completed
- **Phase 1 — auth:** next in line
- Текущий репозиторий уже содержит `apps/web`, `apps/api`, `packages/contracts`, `docker-compose.yml` и root tooling.

## Phase 0 — bootstrap

Цель: поднять каркас проекта.

Сделать:

- pnpm workspace monorepo
- apps/web
- apps/api
- packages/contracts
- eslint/prettier/tsconfig base
- docker compose for postgres + minio
- env examples
- basic README
- health endpoint
- basic Next shell

Результат:

- проект запускается локально;
- есть web и api;
- есть postgres и minio.
- Статус в текущем репозитории: **done**

## Phase 1 — auth

Сделать:

- Prisma schema initial
- register/login/logout/refresh
- session table
- password hashing
- protected route shell in frontend
- current user endpoint
- auth forms

Результат:

- пользователь может зарегистрироваться и войти.
- Статус в текущем репозитории: **current target**

## Phase 2 — chats

Сделать:

- tables chats / chat_members
- direct chat creation
- group chat creation
- chats list endpoint
- chat sidebar UI
- chat route

Результат:

- пользователь видит чаты и может открыть чат.

## Phase 3 — messages history

Сделать:

- messages schema
- GET messages by chat
- cursor pagination
- conversation UI
- composer basic
- reply support in data model and UI basis

Результат:

- история чата загружается и отображается.

## Phase 4 — live messaging

Сделать:

- ws gateway
- auth identify
- message.send
- message.created
- optimistic UI
- reconnect flow
- idempotency via clientId

Результат:

- два клиента могут обмениваться сообщениями в реальном времени.

## Phase 5 — read / typing / presence

Сделать:

- message.read
- message_reads table
- last_read_message_id support
- typing events
- online/offline presence
- UI indicators

Результат:

- видны typing, read, online states.

## Phase 6 — uploads

Сделать:

- presign endpoint
- complete upload endpoint
- uploads table
- message_attachments
- image/file UI
- upload progress

Результат:

- можно отправлять изображения и файлы.

## Phase 7 — search

Сделать:

- FTS for messages
- pg_trgm for users/chats
- search endpoints
- search UI

Результат:

- работает поиск.

## Phase 8 — polish

Сделать:

- responsive improvements
- accessibility passes
- loading/error/empty states
- tests
- final cleanup
- seed/demo data optional

Результат:

- проект готов для портфолио.

## Правило

Не перепрыгивать через этапы без явной необходимости.

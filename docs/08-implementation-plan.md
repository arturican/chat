# Implementation Plan — PulseChat

## Current Checkpoint

- Phase 0 — bootstrap: completed
- Phase 1 — auth: current target
- Phase 2 and beyond: not started

## Phase 0 — bootstrap

Status: **done**

Implemented in the repository:

- pnpm workspace monorepo
- apps/web
- apps/api
- packages/contracts
- shared eslint / prettier / tsconfig base
- docker compose for postgres + minio
- env examples for web and api
- basic README
- health endpoint
- basic Next shell

## Phase 1 — auth

Status: **current target**

Planned work:

- Prisma schema initial
- register / login / logout / refresh
- session table
- password hashing
- protected route shell in frontend
- current user endpoint
- auth forms

Recommended first auth sub-steps:

1. add Prisma and initial schema
2. wire Prisma into `apps/api`
3. add auth contracts if new public DTOs are needed
4. implement backend auth endpoints
5. implement frontend auth pages and protected shell

## Phase 2 — chats

Status: **pending**

Planned work:

- tables `chats` / `chat_members`
- direct chat creation
- group chat creation
- chats list endpoint
- chat sidebar UI
- chat route

## Phase 3 — messages history

Status: **pending**

Planned work:

- messages schema
- GET messages by chat
- cursor pagination
- conversation UI
- composer basic
- reply support in data model and UI basis

## Phase 4 — live messaging

Status: **pending**

Planned work:

- ws gateway
- auth identify
- message.send
- message.created
- optimistic UI
- reconnect flow
- idempotency via clientId

## Phase 5 — read / typing / presence

Status: **pending**

Planned work:

- message.read
- message_reads table
- last_read_message_id support
- typing events
- online / offline presence
- UI indicators

## Phase 6 — uploads

Status: **pending**

Planned work:

- presign endpoint
- complete upload endpoint
- uploads table
- message_attachments
- image / file UI
- upload progress

## Phase 7 — search

Status: **pending**

Planned work:

- FTS for messages
- pg_trgm for users / chats
- search endpoints
- search UI

## Phase 8 — polish

Status: **pending**

Planned work:

- responsive improvements
- accessibility passes
- loading / error / empty states
- tests
- final cleanup
- optional seed/demo data

## Rule

Do not jump over phases unless the repository already contains the missing phase or the user explicitly asks for it.

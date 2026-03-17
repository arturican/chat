# Product Requirements — PulseChat

## Product Goal

PulseChat is a portfolio-grade realtime web messenger with a modern, production-minded architecture.

The project should demonstrate:

- strong frontend structure
- typed backend contracts
- realtime architecture with clear HTTP / WebSocket split
- local developer experience through Docker and pnpm workspaces
- good UX on desktop and mobile

## Current Product Slice

Already implemented in code:

- monorepo bootstrap
- health-checked backend shell
- frontend shell page
- shared contracts package
- local PostgreSQL + MinIO infrastructure

Not implemented yet:

- real users
- sessions
- chats
- messages
- uploads
- realtime delivery
- search

## MVP Target Scope

The intended MVP still includes:

- registration
- login / logout
- refresh token flow
- current profile
- direct and group chats
- message history with cursor pagination
- message send / edit / soft delete
- read state
- typing indicators
- presence
- file uploads through presigned flow
- message search
- responsive UI

## MVP Exclusions

Still out of scope:

- audio and video calls
- end-to-end encryption
- channels
- stories
- push notifications
- advanced multi-device conflict resolution

## Current Phase Boundary

The repository is currently between:

- completed: Phase 0 — bootstrap
- next: Phase 1 — auth

This means product work should now move from infrastructure to user identity and session management.

## Success Criteria For The Current Stage

The current repository state is considered healthy if:

- `pnpm build` passes
- `pnpm lint` passes
- `pnpm typecheck` passes
- `pnpm dev` starts web and api
- `docker compose up -d` starts PostgreSQL and MinIO
- `/api/health` returns `200`

## Success Criteria For MVP

The MVP will be considered successful when:

- a user can register and log in
- a user can open a chat and load history
- two clients can exchange messages in realtime
- uploads work through MinIO-compatible storage
- the project has a clean onboarding and local setup flow

# Architecture — PulseChat

## Current Architecture Snapshot

The repository already implements the bootstrap architecture below:

```txt
/
  apps/
    web/
    api/
  packages/
    contracts/
  docker/
    minio/
```

## Current Runtime Pieces

### apps/web

- Next.js App Router
- one bootstrap landing page
- public env loader for API base URL
- global visual shell styles

### apps/api

- NestJS + Fastify application
- root app module
- validated env loading
- `GET /api/health`
- global `/api` prefix
- CORS configured from env

### packages/contracts

- shared scalar and entity types
- shared HTTP DTO types for current bootstrap and upcoming auth
- shared WebSocket event names and payload maps for future realtime work

### Docker services

- PostgreSQL 16
- MinIO
- one-shot MinIO bucket initializer

## Current Design Decisions

### Monorepo first

The repository is structured for long-term feature work before feature modules exist.

### Contracts before implementation growth

`packages/contracts` already exists so future auth, chat, and realtime code share the same public types instead of duplicating DTO definitions.

### HTTP and WebSocket split remains fixed

Even though realtime is not implemented yet, the protocol boundary is already locked:

- HTTP for auth, CRUD, history, search, upload lifecycle
- WebSocket for live events only

### Bootstrap kept intentionally thin

The current code does not pretend auth, Prisma, or WebSocket features already exist. The codebase contains only the minimum working skeleton needed to begin Phase 1 cleanly.

## Target Architecture Direction

The target architecture remains:

- `apps/web` grows into auth shell, chat shell, message UI, upload UI
- `apps/api` grows into modular NestJS modules
- `packages/contracts` remains the public contract surface for HTTP and WS payloads
- PostgreSQL remains source of truth
- MinIO remains local object storage for upload flow

## Immediate Next Architectural Step

The next real architectural addition should be:

1. Prisma schema and client wiring
2. auth module boundaries in `apps/api`
3. auth route groups and app shell split in `apps/web`

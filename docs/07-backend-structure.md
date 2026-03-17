# Backend Structure — NestJS + Fastify

## Current Backend State

The backend already exists as `apps/api` and includes:

- NestJS bootstrap
- Fastify adapter
- validated app env loader
- root app module
- health module and controller
- `/api` global prefix

Current source structure:

```txt
apps/api/src/
  app.module.ts
  main.ts
  config/
    app-config.ts
  modules/
    health/
      health.controller.ts
      health.module.ts
```

## What The Current Backend Does

- validates required environment variables at startup
- starts a Fastify-based Nest application
- enables CORS from configured app origin
- serves `GET /api/health`

## What It Does Not Do Yet

- Prisma integration
- auth module
- users module
- chats module
- messages module
- uploads module
- search module
- presence module
- websocket module

## Planned Module Direction

The intended backend shape still remains:

```txt
apps/api/src/
  modules/
    auth/
    users/
    chats/
    messages/
    uploads/
    search/
    presence/
    websocket/
  common/
  prisma/
  config/
```

## Recommended Next Backend Step

During Phase 1:

1. add Prisma module or Prisma service
2. add initial auth module
3. add user/session persistence
4. expose register/login/refresh/logout/me endpoints

## Boundary Rule

Controllers should stay thin. Business rules should live in services once real feature modules are introduced.

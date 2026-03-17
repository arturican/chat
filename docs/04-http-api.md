# HTTP API Contract — PulseChat

## Current Implemented API

Only one HTTP endpoint is implemented in code right now:

### GET /api/health

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-03-17T08:31:46.414Z"
}
```

The response shape is typed through `@pulsechat/contracts` as `HealthResponse`.

## Current Response Rules

The intended API error format is already reserved in `packages/contracts`:

```json
{
  "code": "string",
  "message": "string",
  "details": {}
}
```

But no custom API error mapping is implemented in NestJS yet.

## Next HTTP Phase

Phase 1 should add these auth endpoints first:

### POST /api/auth/register

Target request shape already exists in contracts as `RegisterRequest`.

### POST /api/auth/login

Target request shape already exists in contracts as `LoginRequest`.

### POST /api/auth/refresh

Target response shape already exists in contracts as `RefreshResponse`.

### POST /api/auth/logout

Planned but not implemented.

### GET /api/me

Target response shape already exists in contracts as `MeResponse`.

## Planned Later HTTP Areas

After auth, HTTP should expand with:

- chats list and creation
- chat details and members
- message history with cursor pagination
- upload presign and completion
- search endpoints

## Important Contract Rule

When adding new public request or response payloads, place them in `packages/contracts` first and implement the controller second.

# Architecture — PulseChat

## 1. High-level overview

Система состоит из:

- `apps/web` — Next.js frontend;
- `apps/api` — NestJS/Fastify backend;
- PostgreSQL;
- S3-compatible storage;
- WebSocket layer;
- shared contracts package.

## 2. Repository structure

```txt
/
  apps/
    web/
    api/
  packages/
    contracts/
    config/
    ui/
  docs/
  tasks/
  docker/
```

## 3. Frontend responsibilities

Frontend отвечает за:

- auth UI;
- layout и navigation;
- chat list;
- conversation view;
- message composer;
- optimistic updates;
- ws connection lifecycle;
- uploads flow;
- search UI;
- settings UI.

## 4. Backend responsibilities

Backend отвечает за:

- auth;
- session management;
- chat access control;
- message persistence;
- history API;
- realtime event fanout;
- read/typing/presence;
- upload signing;
- search API.

## 5. Data flow

### Отправка текста

1. Клиент отправляет `message.send` через WebSocket.
2. Сервер проверяет пользователя и членство в чате.
3. Сервер создает сообщение в PostgreSQL.
4. Сервер публикует `message.created`.
5. Клиенты обновляют UI.

### Загрузка файла

1. Клиент вызывает HTTP endpoint на presign.
2. Сервер проверяет mime/size и возвращает upload URL.
3. Клиент загружает файл напрямую в S3.
4. Клиент подтверждает завершение upload.
5. Сервер создает attachment metadata.
6. Клиент создает сообщение с attachment.

## 6. Design decisions

### 6.1 HTTP + WebSocket split

HTTP:

- auth;
- initial data;
- history;
- search;
- upload flow.

WebSocket:

- send/edit/delete message;
- read events;
- typing;
- presence;
- delivery of live updates.

### 6.2 Database is source of truth

Никакое сообщение не считается доставленным, пока оно не записано в PostgreSQL.

### 6.3 Cursor pagination

История сообщений загружается по cursor pagination, а не по offset.

### 6.4 Shared contracts

Все DTO, enums, event names и public payload types лежат в `packages/contracts`.

## 7. Security basics

- password hashing;
- short-lived access tokens;
- refresh tokens в httpOnly cookie;
- ws auth handshake;
- rate limiting на auth и message operations;
- file type/size validation;
- authorization checks для каждого chat action.

## 8. Future scalability

На старте это монолит в пределах backend-приложения.
Позже можно выделить:

- dedicated realtime service;
- background workers;
- media processing pipeline;
- notification service.

## 9. Logging / observability

Нужно заложить:

- request logging;
- ws connection logging;
- structured logs;
- error boundary;
- health endpoint.

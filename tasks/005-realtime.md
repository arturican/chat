# Task 005 — Realtime Messaging

## Статус

Ожидает завершения messages history.

## Цель

Добавить live messaging поверх уже существующей message history.

## Зависимости

Нужно завершить:

- auth
- chats
- messages history

## Что нужно сделать

- подключить Nest `WsAdapter`
- реализовать ws gateway
- реализовать `auth.identify`
- реализовать `message.send`
- реализовать `message.created`
- добавить optimistic UI
- добавить reconnect handling
- добавить `clientId` idempotency

## Acceptance Criteria

- два клиента обмениваются сообщениями
- дубликаты не появляются
- reconnect не ломает чат

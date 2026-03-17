# WebSocket Events — PulseChat

## Current State

There is **no WebSocket server implementation yet** in `apps/api`.

However, the project already contains a typed future protocol in `packages/contracts/src/ws.ts`.

That means the repository already knows the intended event names and payload shapes, even though no gateway exists yet.

## Reserved Client Events

Currently defined in contracts:

- `auth.identify`
- `presence.subscribe`
- `message.send`
- `message.edit`
- `message.delete`
- `message.read`
- `chat.typing.start`
- `chat.typing.stop`

## Reserved Server Events

Currently defined in contracts:

- `auth.ack`
- `auth.error`
- `presence.sync`
- `presence.updated`
- `message.created`
- `message.updated`
- `message.deleted`
- `message.read.updated`
- `chat.typing.updated`
- `error`

## What Is Implemented Now

Implemented now:

- typed event names
- typed payload maps
- generic `ClientEvent` and `ServerEvent` wrappers
- union types `AnyClientEvent` and `AnyServerEvent`

Not implemented yet:

- Nest `WsAdapter`
- websocket gateway
- auth handshake handling
- subscriptions
- fanout
- reconnect handling
- optimistic reconciliation

## Next WebSocket Step

Do not implement realtime before auth and message history.

The correct order remains:

1. auth
2. chats
3. messages history
4. websocket gateway

## Reliability Rule

When realtime is implemented later, keep this invariant:

- a message must be persisted in PostgreSQL first
- only after that may `message.created` be broadcast

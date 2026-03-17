# WebSocket Events — PulseChat

## 1. Connection

WebSocket используется для live-событий.
После подключения клиент проходит auth handshake.

## 2. Event envelope

### Client -> Server

```ts
type ClientEvent<T = unknown> = {
  event: string;
  requestId?: string;
  payload: T;
};
```

### Server -> Client

```ts
type ServerEvent<T = unknown> = {
  event: string;
  payload: T;
  ts: string;
};
```

## 3. Client events

### auth.identify

Payload:

```json
{
  "accessToken": "jwt"
}
```

### presence.subscribe

```json
{
  "chatIds": ["uuid"]
}
```

### message.send

```json
{
  "chatId": "uuid",
  "clientId": "local-generated-id",
  "text": "hello",
  "replyToMessageId": null,
  "attachmentIds": []
}
```

### message.edit

```json
{
  "messageId": "uuid",
  "text": "updated text"
}
```

### message.delete

```json
{
  "messageId": "uuid"
}
```

### message.read

```json
{
  "chatId": "uuid",
  "messageId": "uuid"
}
```

### chat.typing.start

```json
{
  "chatId": "uuid"
}
```

### chat.typing.stop

```json
{
  "chatId": "uuid"
}
```

## 4. Server events

### auth.ack

### auth.error

### presence.sync

Снимок текущих online users.

### presence.updated

Изменение online/offline пользователя.

### message.created

Создано новое сообщение.

### message.updated

Сообщение отредактировано.

### message.deleted

Сообщение удалено.

### message.read.updated

Изменился read state.

### chat.typing.updated

Список пользователей, которые печатают.

### error

Единый формат ошибки.

## 5. Reliable delivery notes

- `clientId` обязателен для идемпотентности.
- optimistic message на клиенте должен матчиться по `clientId`.
- при reconnect клиент запрашивает актуальную историю через HTTP.

## 6. Reconnect strategy

Клиент должен:

- автоматически переподключаться;
- повторно аутентифицироваться;
- переподписываться на активные чаты;
- не дублировать optimistic messages.

## 7. Authorization

Каждый ws action должен проверять:

- аутентификацию;
- доступ к чату;
- права на изменение сообщения.

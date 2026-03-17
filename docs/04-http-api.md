# HTTP API Contract — PulseChat

## Общие правила

- Base path: `/api`
- JSON request/response
- Access token: Bearer
- Refresh token: httpOnly cookie
- Все ошибки должны быть сериализуемы:
  - `code`
  - `message`
  - `details?`

## 1. Auth

### POST /api/auth/register

Body:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123",
  "username": "artur"
}
```

Response:

```json
{
  "user": {},
  "accessToken": "..."
}
```

### POST /api/auth/login

Body:

```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```

### POST /api/auth/refresh

- читает refresh cookie
- возвращает новый access token

### POST /api/auth/logout

- инвалидирует текущую сессию

## 2. Me / profile

### GET /api/me

Возвращает текущего пользователя и профиль.

### PATCH /api/me

Изменение display_name, bio, avatar.

## 3. Chats

### GET /api/chats

Query:

- `cursor?`
- `limit?`

Возвращает список чатов для sidebar.

### POST /api/chats/direct

Body:

```json
{
  "targetUserId": "uuid"
}
```

### POST /api/chats/group

Body:

```json
{
  "title": "Project Team",
  "memberIds": ["uuid1", "uuid2"]
}
```

### GET /api/chats/:chatId

Возвращает метаданные чата.

### GET /api/chats/:chatId/members

Список участников.

### PATCH /api/chats/:chatId

Редактирование title/avatar для group chat.

## 4. Messages

### GET /api/chats/:chatId/messages

Query:

- `cursor?`
- `limit?`

Возвращает сообщения по убыванию времени или в agreed format с nextCursor.

### GET /api/messages/:messageId

Возвращает одно сообщение.

### GET /api/chats/:chatId/search

Query:

- `q`
- `cursor?`
- `limit?`

Возвращает совпадения по сообщениям внутри чата.

## 5. Uploads

### POST /api/uploads/presign

Body:

```json
{
  "fileName": "photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 123456
}
```

Response:

```json
{
  "uploadId": "uuid",
  "objectKey": "uploads/.../photo.jpg",
  "uploadUrl": "https://...",
  "publicUrl": null
}
```

### POST /api/uploads/complete

Body:

```json
{
  "uploadId": "uuid"
}
```

## 6. Search

### GET /api/search/users

Query:

- `q`

### GET /api/search/chats

Query:

- `q`

## 7. Health

### GET /api/health

Возвращает состояние сервиса.

## 8. Response envelope (optional)

Если нужен единый envelope:

```json
{
  "data": {},
  "meta": {}
}
```

Но не использовать envelope там, где он только усложняет API.

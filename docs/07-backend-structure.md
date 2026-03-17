# Backend Structure — NestJS + Fastify

## 1. Modules

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

## 2. Required modules

### AuthModule

- register
- login
- refresh
- logout
- session revocation

### UsersModule

- me
- profile update
- public user lookup

### ChatsModule

- create direct chat
- create group chat
- list chats
- chat details
- members

### MessagesModule

- messages history
- search in chat
- create/edit/delete message business rules

### UploadsModule

- presign
- complete upload
- validation
- metadata storage

### SearchModule

- user search
- chat search
- message search

### PresenceModule

- online status
- typing coordination

### WebsocketModule

- ws gateway
- auth
- routing live events
- broadcasting

## 3. Common layer

- guards
- decorators
- interceptors
- exception filters
- pipes
- result/error mappers
- pagination helpers

## 4. Validation

- DTO validation on every external input
- strict schema for ws payloads
- normalize user input where needed

## 5. Authorization rules

### Chat access

Пользователь должен быть членом чата для:

- чтения истории;
- отправки сообщений;
- read events;
- typing;
- поиска внутри чата.

### Message edit/delete

Разрешено:

- отправителю;
- или администратору группы, если такая политика будет включена позже.

## 6. Service boundaries

Контроллеры тонкие.
Вся бизнес-логика — в services.
Доступ к БД — через repository/prisma layer.
Broadcasting — отдельный сервис/utility внутри websocket/presence.

## 7. Error handling

Нужно единообразно обрабатывать:

- validation errors;
- unauthorized;
- forbidden;
- not found;
- conflict;
- rate limit;
- internal errors.

## 8. Env config

Минимум:

- DATABASE_URL
- JWT_ACCESS_SECRET
- JWT_REFRESH_SECRET
- ACCESS_TOKEN_TTL
- REFRESH_TOKEN_TTL
- S3_ENDPOINT
- S3_REGION
- S3_BUCKET
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY
- APP_ORIGIN
- API_PORT

## 9. Health checks

Добавить:

- app liveness
- db connectivity
- optional storage connectivity check later

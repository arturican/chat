# Database Design — PulseChat

## 1. ORM / migration policy

- ORM: Prisma
- PostgreSQL как основная БД
- Миграции строго версионируются
- Любое изменение схемы идет через migration

## 2. Core tables

## users

- id (uuid, pk)
- email (unique)
- password_hash
- created_at
- updated_at

## profiles

- user_id (pk, fk -> users.id)
- username (unique)
- display_name
- bio
- avatar_key
- last_seen_at
- created_at
- updated_at

## sessions

- id (uuid, pk)
- user_id (fk)
- refresh_token_hash
- user_agent
- ip_address
- expires_at
- revoked_at
- created_at

## chats

- id (uuid, pk)
- type (`direct` | `group`)
- title
- avatar_key
- created_by (fk -> users.id)
- last_message_id (nullable)
- created_at
- updated_at

## chat_members

- chat_id (fk)
- user_id (fk)
- role (`owner` | `admin` | `member`)
- joined_at
- last_read_message_id (nullable)
- muted_until (nullable)

Unique:

- (chat_id, user_id)

## messages

- id (uuid, pk)
- chat_id (fk)
- sender_id (fk -> users.id)
- client_id (string, unique per sender)
- type (`text` | `image` | `file` | `system`)
- text (nullable)
- reply_to_message_id (nullable, self fk)
- edited_at (nullable)
- deleted_at (nullable)
- created_at

## message_attachments

- id (uuid, pk)
- message_id (fk)
- object_key
- original_name
- mime_type
- size_bytes
- width (nullable)
- height (nullable)
- duration_seconds (nullable)
- created_at

## message_reads

- message_id (fk)
- user_id (fk)
- read_at

Unique:

- (message_id, user_id)

## message_reactions

- id (uuid, pk)
- message_id (fk)
- user_id (fk)
- emoji
- created_at

Unique:

- (message_id, user_id, emoji)

## uploads

- id (uuid, pk)
- user_id (fk)
- object_key
- bucket
- mime_type
- size_bytes
- status (`pending` | `uploaded` | `linked` | `failed`)
- created_at
- completed_at (nullable)

## 3. Indexes

### messages

- index(chat_id, created_at desc)
- index(sender_id, created_at desc)
- index(reply_to_message_id)

### chats

- index(created_by)
- index(updated_at desc)

### chat_members

- unique(chat_id, user_id)
- index(user_id, joined_at desc)

### profiles

- unique(username)
- trigram index on username
- trigram index on display_name

## 4. Search

### Message search

Использовать PostgreSQL full-text search:

- `tsvector` по `messages.text`
- GIN index

### Fuzzy search

Использовать `pg_trgm`:

- для `profiles.username`
- для `profiles.display_name`
- для `chats.title`

## 5. Modeling notes

### Direct chat uniqueness

Для direct чатов надо предотвратить дублирование одного и того же pair chat.
Решение:

- при создании direct chat сначала искать существующий pair по участникам;
- возможно хранить нормализованный pair key.

### last_message_id

Это denormalized field для ускорения списка чатов.

### last_read_message_id

Хранится в `chat_members` для быстрого расчета unread.

## 6. Deletion policy

- Пользователи физически не удаляются в MVP.
- Сообщения удаляются soft delete через `deleted_at`.
- Attachments в базе можно помечать как detached/obsolete в будущем.

## 7. Example unread strategy

Unread можно считать:

- по `chat_members.last_read_message_id`
- или по `message_reads` для точного статуса.

В MVP:

- для списка чатов использовать `last_read_message_id`;
- для точных read receipts использовать `message_reads`.

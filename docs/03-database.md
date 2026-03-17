# Database Design — PulseChat

## Current State

There is **no Prisma schema in the repository yet**.

What is already prepared:

- PostgreSQL is available through `docker-compose.yml`
- API env config already requires `DATABASE_URL`
- the implementation plan already reserves auth as the next phase

This means the database layer is planned and infrastructure-ready, but not implemented in code yet.

## Next Database Step

The next concrete task is to add Prisma and the initial auth schema.

Recommended first schema scope:

### users

- `id`
- `email`
- `password_hash`
- `created_at`
- `updated_at`

### profiles

- `user_id`
- `username`
- `display_name`
- `bio`
- `avatar_key`
- `last_seen_at`
- `created_at`
- `updated_at`

### sessions

- `id`
- `user_id`
- `refresh_token_hash`
- `user_agent`
- `ip_address`
- `expires_at`
- `revoked_at`
- `created_at`

## Target Full Schema

The intended full schema still includes:

- `users`
- `profiles`
- `sessions`
- `chats`
- `chat_members`
- `messages`
- `message_attachments`
- `message_reads`
- `message_reactions`
- `uploads`

## Current Constraints For Future Work

When Prisma is added, keep these rules:

- PostgreSQL remains the source of truth
- schema changes must go through migrations
- cursor pagination is mandatory for messages
- offset pagination must not be used for chat history
- message persistence must happen before socket fanout

## Indexing Direction

The planned indexing strategy remains:

- `messages(chat_id, created_at desc)`
- `messages(sender_id, created_at desc)`
- `profiles(username)` unique
- trigram indexes for user/chat search later
- FTS for message search later

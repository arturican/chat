# Task 002 — Auth

## Статус

Текущий активный task.

## Цель

Добавить первую реальную прикладную функциональность поверх bootstrap: пользователей, сессии и базовую аутентификацию.

## Что нужно сделать

- добавить Prisma в репозиторий
- описать initial schema для `users`, `profiles`, `sessions`
- подключить Prisma client в `apps/api`
- реализовать `register`, `login`, `refresh`, `logout`
- реализовать `GET /api/me`
- добавить password hashing
- добавить login/register pages в `apps/web`
- добавить protected app shell basis

## Recommended Step Order

1. Prisma schema and client wiring
2. Auth contracts adjustments if needed
3. Backend auth module and endpoints
4. Frontend auth pages
5. Protected shell wiring

## Acceptance Criteria

- можно зарегистрироваться
- можно войти
- refresh работает
- logout завершает сессию
- защищенные роуты недоступны без auth

# Task 002 — Auth

## Статус

Текущий активный task.

## Цель

Сделать базовую аутентификацию.

## Нужно сделать

- Prisma initial schema
- users / profiles / sessions tables
- register/login/logout/refresh
- password hashing
- access + refresh token flow
- current user endpoint
- login/register pages
- protected app shell

## Acceptance criteria

- можно зарегистрироваться
- можно войти
- refresh работает
- logout завершает сессию
- защищенные роуты недоступны без auth

## Рекомендуемый старт

- добавить Prisma schema для `users`, `profiles`, `sessions`
- подключить Prisma client в `apps/api`
- только потом переходить к register/login/refresh и frontend auth forms

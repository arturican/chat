# Testing & Quality — PulseChat

## 1. Types of tests

### Unit

- services
- utils
- validators
- message mapping logic

### Integration

- auth flow
- chats flow
- messages HTTP API
- upload signing
- prisma/database interactions where useful

### E2E

- login
- open chat
- send message
- see message in second client
- upload file basic flow

## 2. Backend quality requirements

- DTO validation covered
- error cases tested
- access control tested
- ws happy-path tested minimally

## 3. Frontend quality requirements

- critical components typed
- UI states covered
- no major hydration issues
- no blocking console errors

## 4. Definition of done

Фича считается завершенной, если:

- код написан;
- типы корректны;
- happy path работает;
- базовые edge cases учтены;
- UI state complete;
- есть инструкция как проверить;
- lint/typecheck/test проходят.

## 5. Commands to support

В проекте должны быть команды:

- `pnpm install`
- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:e2e`

# Frontend Structure — Next.js

## 1. Router

Использовать App Router.

Пример структуры:

```txt
apps/web/
  app/
    (auth)/
      login/page.tsx
      register/page.tsx
    (app)/
      layout.tsx
      chats/page.tsx
      chat/[chatId]/page.tsx
      settings/page.tsx
  src/
    features/
    entities/
    shared/
```

## 2. Layers

### app

Роутинг, layout, providers.

### features

- auth
- chat-list
- conversation
- message-composer
- attachments
- search
- settings

### entities

- user
- chat
- message
- upload

### shared

- ui
- lib/api
- lib/ws
- hooks
- utils
- constants
- schemas

## 3. State strategy

### TanStack Query

Использовать для:

- current user
- chats list
- messages history
- search results
- settings data

### Zustand

Использовать для:

- local UI state
- sidebar open/close
- active chat UI state
- composer draft
- ephemeral modal state

### Socket store

Отдельный слой для live events:

- connection status
- typing map
- presence map
- optimistic message reconciliation

## 4. Core pages

### Login page

- email/password form
- validation
- error states

### Chats page

- sidebar
- current chat preview or redirect
- responsive navigation

### Chat page

- header
- message list
- composer
- right panel optional later

### Settings page

- profile
- theme
- session info later

## 5. UI requirements

- desktop-first shell + excellent mobile adaptation
- skeleton states
- empty states
- error states
- unread markers
- clear selected chat state
- smooth scrolling behavior

## 6. Responsive behavior

### Desktop

- sidebar always visible
- conversation pane visible

### Tablet

- compact sidebar
- good paddings
- sticky composer

### Mobile

- список чатов и активный чат как отдельные режимы
- back navigation visible
- composer fixed at bottom
- touch-friendly hit areas

## 7. Message UI states

Сообщение может быть:

- sending
- sent
- delivered
- read
- failed
- edited
- deleted

## 8. Attachments UI

- preview images
- generic file cards for non-image
- upload progress
- retry on failure
- cancel upload if feasible

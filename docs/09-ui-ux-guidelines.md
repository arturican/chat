# UI / UX Guidelines — PulseChat

## 1. Design goals

Интерфейс должен выглядеть:

- чисто;
- современно;
- спокойно;
- не перегруженно;
- убедительно как реальный продукт.

## 2. Layout principles

- sidebar + conversation layout на desktop;
- focus on content;
- компактная, но не тесная вертикальная ритмика;
- sticky chat header;
- sticky composer.

## 3. Visual system

- скругления умеренные;
- тени мягкие;
- хороший контраст;
- понятная иерархия;
- аккуратные hover/focus states;
- не использовать слишком яркую палитру везде сразу.

## 4. Messaging UX

- новые сообщения появляются без дерганий;
- scroll behavior предсказуем;
- unread separator заметен;
- reply preview компактный;
- deleted message отличается визуально;
- edited state виден, но не шумный.

## 5. Sidebar UX

- chat item показывает:
  - title
  - last message preview
  - time
  - unread badge
  - active state

## 6. Mobile UX

- большие hit areas;
- back button в chat header;
- safe bottom spacing;
- composer не перекрывает контент;
- плавный переход между списком чатов и разговором.

## 7. Empty states

Нужны:

- нет чатов;
- чат пустой;
- поиск ничего не нашел;
- upload failed;
- reconnecting websocket.

## 8. Error UX

Ошибки должны:

- быть понятными;
- не ломать layout;
- давать retry, где это уместно.

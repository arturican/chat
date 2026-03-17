# Frontend Structure — Next.js

## Current Frontend State

The frontend already exists as `apps/web` and includes:

- Next.js App Router setup
- root layout
- one bootstrap landing page
- global stylesheet
- public env loader for API base URL

Current file shape:

```txt
apps/web/
  app/
    globals.css
    layout.tsx
    page.tsx
  src/
    shared/
      config/
        public-env.ts
```

## What The Current Frontend Does

- renders a landing shell page
- shows the current bootstrap status
- reads the public API base URL from env with a safe local fallback
- builds successfully as static content

## What It Does Not Do Yet

- auth pages
- protected app shell
- chat layout
- sidebar
- conversation UI
- message composer
- query state
- websocket state

## Planned Frontend Direction

The intended structure still grows toward:

```txt
apps/web/
  app/
    (auth)/
    (app)/
  src/
    features/
    entities/
    shared/
```

But these slices should be introduced only when Phase 1 and Phase 2 need them.

## Recommended Next Frontend Step

For auth phase, the next frontend additions should be:

- `(auth)/login/page.tsx`
- `(auth)/register/page.tsx`
- `(app)/layout.tsx`
- lightweight auth-aware route shell
- shared API layer under `src/shared`

## UI Rule For Future Work

Keep the current shell style intentional and avoid collapsing into plain boilerplate once auth and chat views are added.

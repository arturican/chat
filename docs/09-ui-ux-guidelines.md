# UI / UX Guidelines — PulseChat

## Current UI State

The repository currently contains only a bootstrap shell UI in `apps/web/app/page.tsx`.

The current shell already establishes:

- dark atmospheric background
- glass-like panels
- clear bootstrap status messaging
- responsive single-column fallback on smaller screens

## What The Current UI Is For

The existing page is not the final messenger UI.

Its job is to:

- confirm the frontend starts correctly
- expose the current API base URL
- provide a stable visual base for future auth and chat routes

## Design Direction For The Real App

Future UI should feel:

- modern
- calm
- dense but readable
- responsive without feeling mobile-only
- like a real communication product rather than a component demo

## Messaging UX Goals

Once message UI exists, keep these targets:

- stable scrolling
- visible unread separators
- compact reply preview
- subtle edited / deleted states
- clear active chat state
- loading / error / empty states on every important screen

## Auth UI Direction

The next frontend phase should add:

- login page
- register page
- protected app shell
- useful loading and error states

## Guardrail

Do not document UI that does not exist yet as if it is already implemented.
Describe the current shell as current state and chat UX rules as planned direction.

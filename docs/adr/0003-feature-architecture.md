# ADR 0003 — Feature-based architecture

## Status
Accepted

## Context
Component-type folders (`components/`, `composables/` only) do not scale. Features need colocated UI, state, schemas, and docs without leaking domain rules into pages.

## Decision
Use:
- `app/` for Nuxt shell (pages, layouts, shared UI atoms)
- `features/<name>/` for domain UI, stores, schemas, composables
- `shared/` for cross-feature primitives
- `server/` for Nitro API, services, repositories, database

Dependency rule: `app` → `features` → `shared`; `server` → `shared` + feature schemas; features never import server internals.

## Consequences
- More folders early, clearer boundaries later
- Auto-import configured per feature component folder
- Prevents “god components” and duplicated fetch logic

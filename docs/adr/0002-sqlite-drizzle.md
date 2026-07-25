# ADR 0002 — SQLite via Drizzle instead of JSON files

## Status
Accepted

## Context
The curriculum forbids external backends but still needs realistic persistence: transactions, migrations, concurrent writes, and typed queries.

## Decision
Use local SQLite (better-sqlite3) with Drizzle ORM behind repository interfaces. Seed a demo user and tasks on first boot.

## Alternatives considered
- JSON file store: simple, but race-prone and weak for joins/indexes
- IndexedDB only: client-only, teaches less about Nitro/server boundaries
- In-memory Map: great for unit tests, insufficient for persistence demos

## Consequences
- Slightly more setup than JSON
- Teaches repository/service boundaries transferable to Postgres later
- Database file lives in `.data/` (gitignored)

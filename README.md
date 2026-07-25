# TaskFlow

A focused, self-contained todo product built with Nuxt 4 — priorities, due dates, a
calendar, and productivity analytics, with complete local authentication (password +
simulated Google/GitHub social login).

> No external REST/GraphQL/BaaS backends. Everything — auth, sessions, OAuth, CRUD,
> analytics — is implemented with Nitro + local SQLite. The repository doubles as a
> teaching codebase for Vue/Nuxt (see [`docs/`](docs)), while the product UI speaks
> only to TaskFlow users.

## Stack

- Nuxt 4 · Vue 3 · TypeScript · Composition API
- Nuxt UI · Tailwind CSS · Pinia · VueUse · Zod
- Nitro server API · Drizzle ORM · SQLite
- Vitest · Playwright · ESLint · Prettier · Husky

## Quick start

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

A demo account is seeded on first run:

- **Email:** `demo@taskflow.app`
- **Password:** `Demo123!pass`

## Pages (exactly 10)

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Password + mock Google/GitHub login |
| `/register` | Account creation |
| `/dashboard` | Personal overview and quick actions |
| `/tasks` | Searchable/filterable task workspace |
| `/tasks/[id]` | Task detail / edit |
| `/calendar` | Due-date calendar |
| `/analytics` | Single-user productivity analytics |
| `/profile` | Identity and connected accounts |
| `/settings` | Theme, task defaults, sessions, security |

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Start Nuxt dev server |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript via `nuxt typecheck` |
| `pnpm test` | Vitest (unit, integration, component) |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm lint:fix` | Prettier write |

## Security model

- Passwords hashed with Node's built-in **scrypt** (memory-hard, no native deps);
  hashes are never returned to the client.
- **httpOnly**, `SameSite=Lax`, `Secure`-in-prod session cookies with opaque random
  tokens; sessions rotate on login, expire, and can be revoked ("sign out other
  sessions").
- **Double-submit CSRF** tokens plus a same-origin check on all mutating API requests.
- In-process **rate limiting** on auth endpoints, timing-safe password comparison,
  normalized emails, and generic credential errors.
- Google/GitHub login is a **local OAuth simulation** behind provider adapters that
  mimic redirect → callback → account-linking, so swapping in real OAuth later is a
  contained adapter change.

## Architecture

```
app/           Nuxt shell: pages, layouts, shared UI, plugins, middleware
features/      Feature slices: auth, tasks, dashboard, calendar, analytics, settings
shared/        Cross-feature types, schemas, utils, composables
server/        Nitro API, services, repositories, SQLite (Drizzle)
docs/          ADRs + lessons
tests/         Unit, integration, component, e2e
```

Boundaries: components stay presentational, business rules live in composables /
stores / services, and all SQL lives in repositories. Dashboard, calendar, and
analytics are derived from the authenticated user's tasks on the server, so there is
one source of truth.

## Learning material

The product ships without any teaching copy, but the repo still teaches:

- [`docs/lessons/01-tasks.md`](docs/lessons/01-tasks.md) — the tasks vertical slice.
- [`docs/lessons/02-auth.md`](docs/lessons/02-auth.md) — auth, sessions, CSRF, and the
  OAuth simulation.
- [`docs/lessons/03-board-interactions.md`](docs/lessons/03-board-interactions.md) —
  kanban columns, DnD, bulk actions, swipe, inline edit, custom form controls.
- [`docs/adr/`](docs/adr) — architecture decision records.

# Lesson 01 — Tasks vertical slice

## 1. Theory

A **vertical slice** delivers one user-visible capability through every layer:

UI → composable → Pinia → `$fetch` → Nitro route → service → repository → SQLite

You are not learning “how to make a todo list.” You are learning how production Nuxt apps keep those layers honest.

### Reactivity tools used on purpose

| API | Where | Why |
|---|---|---|
| `ref` | form fields, UI toggles | Independent primitive state |
| `computed` | filters, selected task, pagination flags | Derived state without duplication |
| `watch` | debounced search → refetch | React to external changes |
| `watchEffect` | surface async errors as toasts | Auto-track dependencies for side effects |
| `shallowRef` | board snapshot list | Avoid deep proxying large arrays when replacing wholes |
| `readonly` | expose toast/search state safely | Prevent accidental writes from consumers |
| `effectScope` | `useTasks` | Dispose experimental watchers cleanly |
| `nextTick` | focus after validation failure | Wait for DOM update |
| `markRaw` | deleted-task undo snapshot | Skip reactivity for plain restore payloads |
| `provide`/`inject` | TaskBoard → TaskItem | Compound component context without prop drilling |

### Composition API surface covered

- `script setup`, `defineProps`, `defineEmits`, `defineExpose`, `defineModel`
- slots via Nuxt UI primitives
- `Teleport` for toasts
- `KeepAlive` around the create form
- `TransitionGroup` for list animations
- dynamic route params in `/tasks/:id`
- catch-all lesson route under `/learn/*`

## 2. Why this exists

Tutorials often stop at `ref([])` in a page. That collapses when you add validation, concurrency, pagination, undo, accessibility, and SSR. This slice forces those concerns into the right homes.

## 3. Alternatives

1. **Page-local state only** — fastest demo, worst reuse
2. **Pinia as a second backend** — stores mutate forever without server truth
3. **JSON file API** — easy, unsafe under concurrent writes
4. **External BaaS** — forbidden here; hides Nitro skills you need

## 4. Trade-offs

- Optimistic updates feel instant but need rollback + version checks
- Repository/service split adds files; it pays off at feature #3
- Dev session cookies unlock protected routes before Auth exists — temporary on purpose

## 5. What we implemented

- Zod schemas for create/update/list
- Drizzle SQLite schema + seed data
- Nitro CRUD with pagination, search, filter, sort, 409 conflicts
- Pinia store with optimistic update/delete + undo
- Accessible board UI (keyboard, ARIA listbox/option, focus management)
- Layouts: default, marketing, auth scaffold, dashboard
- Vitest unit tests + Playwright e2e smoke

## 6. Refactor notes

After the first working CRUD path we extracted:
- `defineApiHandler` for consistent errors
- `useTasks` so pages stay thin
- mappers/factories so tests do not hand-build invalid objects

Important production lessons discovered while wiring E2E:
- Do not mutate Pinia inside `useAsyncData` fetchers — hydrate the store from the returned payload or SSR/client HTML will diverge
- Prefer awaiting async submit handlers before resetting forms
- Design-system selects may model `{ label, value }` objects; coerce or use stable native controls at validation boundaries
- Stable `data-testid` hooks beat brittle accessible-name guesses for critical flows

## 7. Optimize

- Debounced search reduces API chatter
- `shallowRef` + list replace avoids deep reactive cost
- SQLite WAL mode improves concurrent read/write behavior
- Route rules prerender the marketing home; tasks stay SSR

## 8. Test strategy

- Unit: pagination math, Zod schemas, factories, Zod error flattening
- E2E: landing → tasks, create task happy path
- Manual: toggle complete, delete + undo, conflict by editing same task in two tabs

## 9. Exercises

1. Add a `dueDate` date picker and wire it through schema → API → UI.
2. Implement tag click-to-filter without duplicating fetch logic.
3. Replace optimistic delete with a confirm dialog using a renderless `useConfirm` composable.
4. Write a Vitest case that proves update with a stale `version` returns conflict semantics.
5. Convert TaskDetailPanel into an async component loaded only when a task is selected.

## 10. Senior interview questions

1. When would you choose `shallowRef` over `ref` for a list of entities?
2. How does optimistic concurrency (`version`) differ from `updatedAt` checks?
3. Why keep Zod schemas in `features/` instead of only on the server?
4. What breaks if components call `$fetch` directly instead of going through a store/composable?
5. How would you adapt this repository for Postgres without rewriting the UI?

## 11. Suggested improvements

- Full Auth slice (replace dev session)
- Soft deletes + recycle bin
- Bulk actions and CSV export
- Realtime sync via Server-Sent Events (still self-contained)

## Next slice preview

**Authentication & sessions** — register/login/logout, secure cookies, CSRF concepts, email verification mock, OTP mock, protected pages, and retiring `allowDevSession`.

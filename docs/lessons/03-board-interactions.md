# Lesson 03 — Board interactions

This lesson covers the kanban board: status columns, drag-and-drop, multi-select
bulk actions, swipe gestures, inline editing, and why TaskFlow ships its own
`AppSelect` / `AppDatePicker` instead of raw native or Nuxt UI selects in forms.

## Why a status kanban (not a flat list)

A flat list + status filter teaches pagination well, but "drag between categories"
needs **spatial columns**. Columns map 1:1 to `todo` / `in_progress` / `done`.
`archived` stays a filter value, not a drop target — that keeps the board scannable.

Grouping is a pure helper ([`groupTasksByStatus`](../../features/tasks/utils/groupByStatus.ts))
so it is unit-tested without Vue or Nitro.

## Drag-and-drop without a DnD library

HTML5 DnD is enough for **column moves**:

1. Card sets `dataTransfer` with the task id on `dragstart`
2. Column `dragover` + `drop` call `moveTaskById` → optimistic `updateTask({ status })`
3. Same-status drops are no-ops

Within-column reorder is intentionally omitted (no `sortOrder` column). If you add
it later, prefer a dedicated order field and a library only if HTML5 friction hurts
accessibility.

Keyboard users get an **`AppSelect` status control on each card** and bulk Move —
DnD must never be the only path.

## Multi-select + bulk API

Selection (`selectedIds`) is separate from the detail panel's `selectedId`.

Bulk actions hit `POST /api/tasks/bulk` with `{ action, ids, status? }` so the client
does not fire N CSRF-protected PATCHes with ambiguous partial failure. The service
is **best-effort per id** and returns `{ updated, failed }`; the store applies an
optimistic patch and rolls back rejected ids.

## Touch actions + inline edit

- **Touch actions**: complete tasks with the checkbox and delete them with the
  always-visible mobile delete button.
- **Inline rename**: double-click / Enter → input; blur / Enter saves; Escape
  cancels. Full edit remains on `/tasks/[id]`.

## Custom select & date picker

Earlier E2E work showed Nuxt UI selects can bind `{ label, value }` objects and
break Zod. TaskFlow's [`AppSelect`](../../app/components/ui/AppSelect.vue) and
[`AppDatePicker`](../../app/components/ui/AppDatePicker.vue) always use **primitive**
models (`string` / `YYYY-MM-DD`) and stable `data-testid`s — good UI without
sacrificing test determinism.

## Exercises

1. Add within-column `sortOrder` and keyboard reordering (↑/↓).
2. Persist multi-select across filter changes without selecting invisible tasks.
3. Replace HTML5 DnD with pointer-based drag for better mobile + a11y, keeping the
   same `moveTaskById` contract.
4. Add an "Undo bulk delete" that restores all deleted ids from a snapshot.

## Interview prompts

- Why keep bulk mutations on one endpoint instead of Promise.all of PATCHes?
- What breaks if `AppSelect` modeled `{label,value}` objects into Zod enums?
- How do you keep SSR HTML and Pinia in sync when the board hydrates?

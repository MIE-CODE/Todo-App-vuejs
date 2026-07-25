/**
 * Tiny date helpers shared by client and server.
 * Formatting uses the runtime locale; keep pure and side-effect free.
 */

export function toIsoDate(value: Date | string | number): string {
  return new Date(value).toISOString()
}

export function nowIso(): string {
  return new Date().toISOString()
}

/** `YYYY-MM-DD` for `<input type="date">` binding. */
export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) {
    return ''
  }
  return new Date(iso).toISOString().slice(0, 10)
}

/** Converts a `YYYY-MM-DD` input value back to an ISO datetime (noon UTC). */
export function fromDateInputValue(value: string): string | null {
  if (!value) {
    return null
  }
  return new Date(`${value}T12:00:00.000Z`).toISOString()
}

/**
 * Combines a due date (ISO or `YYYY-MM-DD`) with an optional `HH:mm` local time.
 * Without a time we keep the noon-UTC date-only convention; with a time we
 * anchor to the user's local timezone so alarms fire at the wall-clock moment.
 */
export function combineDueDateTime(
  date: string | null | undefined,
  time: string | null | undefined
): string | null {
  if (!date) {
    return null
  }

  const ymd = date.slice(0, 10)

  if (!time) {
    return new Date(`${ymd}T12:00:00.000Z`).toISOString()
  }

  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  const local = new Date(`${ymd}T00:00:00`)
  local.setHours(hours, minutes, 0, 0)
  return local.toISOString()
}

/** `HH:mm` for `<input type="time">` binding. */
export function toTimeInputValue(time: string | null | undefined): string {
  return time ?? ''
}

/** Formats a 12-hour clock label from an `HH:mm` value, e.g. "2:30 PM". */
export function formatTimeLabel(time: string | null | undefined): string {
  if (!time) {
    return ''
  }
  const [hours = 0, minutes = 0] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

/**
 * Due label for lists/detail: date always, appended time only when set.
 * e.g. "Mar 3, 2026" or "Mar 3, 2026 · 2:30 PM".
 */
export function formatDueLabel(
  iso: string | null | undefined,
  time: string | null | undefined
): string {
  if (!iso) {
    return '—'
  }
  const datePart = formatDate(iso)
  return time ? `${datePart} · ${formatTimeLabel(time)}` : datePart
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—'
  }
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

/** Human relative label for a due date, e.g. "Today", "in 3 days", "2 days ago". */
export function formatRelativeDue(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) {
    return 'No due date'
  }

  const due = new Date(iso)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const startOfDue = new Date(due)
  startOfDue.setHours(0, 0, 0, 0)

  const dayMs = 1000 * 60 * 60 * 24
  const diffDays = Math.round((startOfDue.getTime() - startOfToday.getTime()) / dayMs)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1) return `in ${diffDays} days`
  return `${Math.abs(diffDays)} days ago`
}

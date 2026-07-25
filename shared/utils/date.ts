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

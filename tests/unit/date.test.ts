import { describe, expect, it } from 'vitest'
import { combineDueDateTime, formatDueLabel } from '../../shared/utils/date'

describe('combineDueDateTime', () => {
  it('returns null without a date', () => {
    expect(combineDueDateTime(null, '09:00')).toBeNull()
    expect(combineDueDateTime(undefined, null)).toBeNull()
  })

  it('keeps the noon-UTC date-only convention when no time is set', () => {
    expect(combineDueDateTime('2026-03-03', null)).toBe('2026-03-03T12:00:00.000Z')
    // Accepts a full ISO date too, using only its date slice.
    expect(combineDueDateTime('2026-03-03T00:00:00.000Z', null)).toBe(
      '2026-03-03T12:00:00.000Z'
    )
  })

  it('anchors the time to the local wall clock', () => {
    const iso = combineDueDateTime('2026-03-03', '14:30')
    expect(iso).not.toBeNull()
    const parsed = new Date(iso as string)
    expect(parsed.getHours()).toBe(14)
    expect(parsed.getMinutes()).toBe(30)
  })
})

describe('formatDueLabel', () => {
  it('renders a placeholder without a date', () => {
    expect(formatDueLabel(null, null)).toBe('—')
  })

  it('shows the date only when no time is present', () => {
    const label = formatDueLabel('2026-03-03T12:00:00.000Z', null)
    expect(label).not.toContain('·')
  })

  it('appends the time when present', () => {
    const label = formatDueLabel('2026-03-03T12:00:00.000Z', '14:30')
    expect(label).toContain('·')
    expect(label).toContain('30')
  })
})

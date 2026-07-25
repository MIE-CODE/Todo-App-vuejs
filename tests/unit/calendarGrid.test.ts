import { describe, expect, it } from 'vitest'
import { buildMonthGrid } from '#features/calendar/utils/grid'

describe('buildMonthGrid', () => {
  const today = new Date('2026-07-15T00:00:00.000Z')

  it('always returns a 6-week (42 cell) grid', () => {
    expect(buildMonthGrid(2026, 7, 'monday', today)).toHaveLength(42)
    expect(buildMonthGrid(2026, 2, 'sunday', today)).toHaveLength(42)
  })

  it('marks the correct number of in-month days for July 2026 (31 days)', () => {
    const grid = buildMonthGrid(2026, 7, 'monday', today)
    expect(grid.filter((cell) => cell.inMonth)).toHaveLength(31)
  })

  it('flags today', () => {
    const grid = buildMonthGrid(2026, 7, 'monday', today)
    const todayCell = grid.find((cell) => cell.isToday)
    expect(todayCell?.key).toBe('2026-07-15')
    expect(todayCell?.inMonth).toBe(true)
  })

  it('honors the week-start day for leading padding', () => {
    // July 1 2026 is a Wednesday.
    const monday = buildMonthGrid(2026, 7, 'monday', today)
    const sunday = buildMonthGrid(2026, 7, 'sunday', today)
    // Monday-start has 2 leading days (Mon, Tue); Sunday-start has 3 (Sun, Mon, Tue).
    expect(monday.findIndex((c) => c.inMonth)).toBe(2)
    expect(sunday.findIndex((c) => c.inMonth)).toBe(3)
  })
})

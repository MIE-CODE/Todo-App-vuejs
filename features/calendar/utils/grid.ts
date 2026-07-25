import type { WeekStartDay } from '#shared/constants/app'

export interface CalendarDay {
  /** `YYYY-MM-DD` key. */
  key: string
  day: number
  inMonth: boolean
  isToday: boolean
}

/**
 * Builds a 6-week (42-cell) month grid, padding with leading/trailing days from
 * adjacent months. Pure and deterministic so it can be unit-tested and used on
 * server or client without surprises.
 */
export function buildMonthGrid(
  year: number,
  month: number,
  weekStart: WeekStartDay = 'monday',
  today: Date = new Date()
): CalendarDay[] {
  const firstOfMonth = new Date(Date.UTC(year, month - 1, 1))
  const startDow = firstOfMonth.getUTCDay() // 0 = Sunday
  const weekStartIndex = weekStart === 'monday' ? 1 : 0
  const leading = (startDow - weekStartIndex + 7) % 7

  const gridStart = new Date(firstOfMonth)
  gridStart.setUTCDate(firstOfMonth.getUTCDate() - leading)

  const todayKey = toKey(today.getUTCFullYear(), today.getUTCMonth() + 1, today.getUTCDate())

  const days: CalendarDay[] = []
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + i)
    const key = toKey(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())

    days.push({
      key,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
      isToday: key === todayKey
    })
  }

  return days
}

export const WEEKDAY_LABELS: Record<WeekStartDay, string[]> = {
  sunday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  monday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

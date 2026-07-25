import { computed, ref } from 'vue'
import type { Task } from '#features/tasks/schemas/task'
import type { WeekStartDay } from '#shared/constants/app'
import { buildMonthGrid } from '#features/calendar/utils/grid'
import { useAuth } from '#features/auth/composables/useAuth'

interface CalendarResponse {
  year: number
  month: number
  tasks: Task[]
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Calendar orchestration: tracks the visible month, loads that month's
 * due-dated tasks (SSR-friendly), and groups them by day for the grid.
 */
export function useCalendar() {
  const { $api } = useNuxtApp()
  const { preferences } = useAuth()

  const now = new Date()
  const year = ref(now.getFullYear())
  const month = ref(now.getMonth() + 1)

  const weekStart = computed<WeekStartDay>(() => preferences.value?.weekStart ?? 'monday')

  const { data, pending, error, refresh } = useAsyncData<CalendarResponse>(
    () => `calendar-${year.value}-${month.value}`,
    () => $api<CalendarResponse>('/api/calendar', { query: { year: year.value, month: month.value } }),
    { watch: [year, month] }
  )

  const tasksByDay = computed(() => {
    const map = new Map<string, Task[]>()
    for (const task of data.value?.tasks ?? []) {
      if (!task.dueDate) continue
      const key = new Date(task.dueDate).toISOString().slice(0, 10)
      const bucket = map.get(key) ?? []
      bucket.push(task)
      map.set(key, bucket)
    }
    return map
  })

  const grid = computed(() => buildMonthGrid(year.value, month.value, weekStart.value))

  const label = computed(() => `${MONTH_NAMES[month.value - 1]} ${year.value}`)

  function next() {
    if (month.value === 12) {
      month.value = 1
      year.value += 1
    } else {
      month.value += 1
    }
  }

  function previous() {
    if (month.value === 1) {
      month.value = 12
      year.value -= 1
    } else {
      month.value -= 1
    }
  }

  function goToday() {
    const today = new Date()
    year.value = today.getFullYear()
    month.value = today.getMonth() + 1
  }

  return {
    year,
    month,
    label,
    weekStart,
    grid,
    tasksByDay,
    pending,
    error,
    refresh,
    next,
    previous,
    goToday
  }
}

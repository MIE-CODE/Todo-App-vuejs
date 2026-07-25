<script setup lang="ts">
import type { CalendarGridItem } from '#features/calendar/types'
import { buildMonthGrid } from '#features/calendar/utils/grid'

export interface ShowcaseEvent {
  /** Day of the month (1–31) within the showcase month. */
  day: number
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  done?: boolean
}

const props = withDefaults(
  defineProps<{
    /** Override year/month for deterministic demos; defaults to the current month. */
    year?: number
    month?: number
    events?: ShowcaseEvent[]
  }>(),
  {
    events: () => [
      { day: 3, title: 'Team standup notes', priority: 'low' },
      { day: 5, title: 'Ship landing polish', priority: 'high' },
      { day: 5, title: 'Review pull requests', priority: 'medium' },
      { day: 8, title: 'Dentist appointment', priority: 'medium' },
      { day: 12, title: 'Deep work block', priority: 'high' },
      { day: 12, title: 'Grocery run', priority: 'low' },
      { day: 15, title: 'Quarterly report', priority: 'urgent' },
      { day: 18, title: 'Design critique', priority: 'medium' },
      { day: 21, title: 'Pay invoices', priority: 'high' },
      { day: 24, title: 'Plan next sprint', priority: 'medium' },
      { day: 27, title: 'Family dinner', priority: 'low' }
    ]
  }
)

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const now = new Date()
const year = ref(props.year ?? now.getFullYear())
const month = ref(props.month ?? now.getMonth() + 1)

const label = computed(() => `${MONTH_NAMES[month.value - 1]} ${year.value}`)

const grid = computed(() => buildMonthGrid(year.value, month.value, 'monday', now))

const daysInMonth = computed(() =>
  new Date(Date.UTC(year.value, month.value, 0)).getUTCDate()
)

const itemsByDay = computed(() => {
  const map = new Map<string, CalendarGridItem[]>()
  for (const event of props.events) {
    if (event.day < 1 || event.day > daysInMonth.value) {
      continue
    }
    const key = `${year.value}-${String(month.value).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`
    const bucket = map.get(key) ?? []
    bucket.push({
      id: `${key}-${event.title}`,
      title: event.title,
      priority: event.priority,
      done: event.done
    })
    map.set(key, bucket)
  }
  return map
})

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
</script>

<template>
  <div data-testid="landing-calendar-showcase">
    <CalendarMonthGrid
      :label="label"
      label-as="h3"
      week-start="monday"
      :grid="grid"
      :items-by-day="itemsByDay"
      @today="goToday"
      @previous="previous"
      @next="next"
    />
  </div>
</template>

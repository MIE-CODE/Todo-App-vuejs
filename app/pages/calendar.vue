<script setup lang="ts">
import type { CalendarGridItem } from '#features/calendar/types'
import { useCalendar } from '#features/calendar/composables/useCalendar'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Calendar · TaskFlow' })

const {
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
} = useCalendar()

const itemsByDay = computed(() => {
  const map = new Map<string, CalendarGridItem[]>()
  for (const [key, tasks] of tasksByDay.value) {
    map.set(
      key,
      tasks.map(task => ({
        id: task.id,
        title: task.title,
        priority: task.priority,
        to: `/tasks/${task.id}`,
        done: task.status === 'done'
      }))
    )
  }
  return map
})
</script>

<template>
  <div class="space-y-6">
    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load the calendar"
      :description="error.message"
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <CalendarMonthGrid
      v-else
      :label="label"
      :week-start="weekStart"
      :grid="grid"
      :items-by-day="itemsByDay"
      :pending="pending"
      @today="goToday"
      @previous="previous"
      @next="next"
    />
  </div>
</template>

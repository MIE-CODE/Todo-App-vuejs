<script setup lang="ts">
import { WEEKDAY_LABELS } from '#features/calendar/utils/grid'
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

const priorityDot: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-muted'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-semibold">
        {{ label }}
      </h1>
      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          @click="goToday"
        >
          Today
        </UButton>
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          aria-label="Previous month"
          @click="previous"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          aria-label="Next month"
          @click="next"
        />
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load the calendar"
      :description="error.message"
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <div
      v-else
      class="overflow-hidden rounded-xl border border-default"
      :class="{ 'opacity-60': pending }"
    >
      <div class="grid grid-cols-7 border-b border-default bg-muted/40 text-center text-xs font-medium text-muted">
        <div
          v-for="weekday in WEEKDAY_LABELS[weekStart]"
          :key="weekday"
          class="py-2"
        >
          {{ weekday }}
        </div>
      </div>

      <div class="grid grid-cols-7">
        <div
          v-for="cell in grid"
          :key="cell.key"
          class="min-h-24 border-b border-r border-default p-1.5 last:border-r-0"
          :class="cell.inMonth ? 'bg-default' : 'bg-muted/20'"
        >
          <div class="flex items-center justify-between">
            <span
              class="inline-flex size-6 items-center justify-center rounded-full text-xs"
              :class="[
                cell.isToday ? 'bg-primary font-semibold text-white' : '',
                cell.inMonth ? 'text-default' : 'text-muted'
              ]"
            >
              {{ cell.day }}
            </span>
          </div>

          <ul class="mt-1 space-y-1">
            <li
              v-for="task in tasksByDay.get(cell.key) ?? []"
              :key="task.id"
            >
              <NuxtLink
                :to="`/tasks/${task.id}`"
                class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs hover:bg-muted"
                :class="task.status === 'done' ? 'text-muted line-through' : ''"
              >
                <span
                  class="size-1.5 shrink-0 rounded-full"
                  :class="priorityDot[task.priority]"
                />
                <span class="truncate">{{ task.title }}</span>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

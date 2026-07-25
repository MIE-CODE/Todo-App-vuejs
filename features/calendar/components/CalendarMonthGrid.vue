<script setup lang="ts">
import type { CalendarGridItem } from '#features/calendar/types'
import type { CalendarDay } from '#features/calendar/utils/grid'
import { WEEKDAY_LABELS } from '#features/calendar/utils/grid'
import type { WeekStartDay } from '#shared/constants/app'

const props = withDefaults(
  defineProps<{
    label: string
    weekStart?: WeekStartDay
    grid: CalendarDay[]
    itemsByDay: Map<string, CalendarGridItem[]>
    pending?: boolean
    /** Show Today / prev / next controls (default true). */
    showNavigation?: boolean
    /** Heading element for the month label (h1 on the auth page, h3 on marketing). */
    labelAs?: 'h1' | 'h2' | 'h3' | 'p'
  }>(),
  {
    weekStart: 'monday',
    pending: false,
    showNavigation: true,
    labelAs: 'h1'
  }
)

const emit = defineEmits<{
  today: []
  previous: []
  next: []
}>()

const priorityDot: Record<CalendarGridItem['priority'], string> = {
  urgent: 'bg-error',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-muted'
}

const weekdays = computed(() => WEEKDAY_LABELS[props.weekStart])
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <component
        :is="labelAs"
        class="text-2xl font-semibold"
      >
        {{ label }}
      </component>
      <div
        v-if="showNavigation"
        class="flex items-center gap-2"
      >
        <UButton
          color="neutral"
          variant="soft"
          @click="emit('today')"
        >
          Today
        </UButton>
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="ghost"
          aria-label="Previous month"
          @click="emit('previous')"
        />
        <UButton
          icon="i-lucide-chevron-right"
          color="neutral"
          variant="ghost"
          aria-label="Next month"
          @click="emit('next')"
        />
      </div>
    </div>

    <div
      class="overflow-hidden rounded-xl border border-default"
      :class="{ 'opacity-60': pending }"
      data-testid="calendar-month-grid"
    >
      <div class="grid grid-cols-7 border-b border-default bg-muted/40 text-center text-xs font-medium text-muted">
        <div
          v-for="weekday in weekdays"
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
              v-for="item in itemsByDay.get(cell.key) ?? []"
              :key="item.id"
            >
              <NuxtLink
                v-if="item.to"
                :to="item.to"
                class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs hover:bg-muted"
                :class="item.done ? 'text-muted line-through' : ''"
              >
                <span
                  class="size-1.5 shrink-0 rounded-full"
                  :class="priorityDot[item.priority]"
                />
                <span class="truncate">{{ item.title }}</span>
              </NuxtLink>
              <span
                v-else
                class="flex items-center gap-1 truncate rounded px-1 py-0.5 text-xs"
                :class="item.done ? 'text-muted line-through' : ''"
              >
                <span
                  class="size-1.5 shrink-0 rounded-full"
                  :class="priorityDot[item.priority]"
                />
                <span class="truncate">{{ item.title }}</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

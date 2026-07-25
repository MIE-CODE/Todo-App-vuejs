<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildMonthGrid, WEEKDAY_LABELS } from '#features/calendar/utils/grid'

export interface ShowcaseEvent {
  /** Day of the month (1–31) within the showcase month. */
  day: number
  title: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
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

const now = new Date()
const year = computed(() => props.year ?? now.getFullYear())
const month = computed(() => props.month ?? now.getMonth() + 1)

const monthLabel = computed(() =>
  new Date(Date.UTC(year.value, month.value - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
)

const grid = computed(() => buildMonthGrid(year.value, month.value, 'monday', now))

const daysInMonth = computed(() =>
  new Date(Date.UTC(year.value, month.value, 0)).getUTCDate()
)

const eventsByDay = computed(() => {
  const map = new Map<number, ShowcaseEvent[]>()
  for (const event of props.events) {
    if (event.day < 1 || event.day > daysInMonth.value) {
      continue
    }
    const bucket = map.get(event.day) ?? []
    bucket.push(event)
    map.set(event.day, bucket)
  }
  return map
})

const priorityClass: Record<ShowcaseEvent['priority'], string> = {
  urgent: 'bg-error',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-slate-400'
}

const activeDay = ref<number | null>(null)
const animated = ref(false)
let cycleTimer: ReturnType<typeof setInterval> | null = null

const featuredDays = computed(() =>
  [...eventsByDay.value.keys()].sort((a, b) => a - b)
)

const activeEvents = computed(() => {
  if (activeDay.value == null) {
    return []
  }
  return eventsByDay.value.get(activeDay.value) ?? []
})

const activeDayLabel = computed(() => {
  if (activeDay.value == null) {
    return ''
  }
  return new Date(Date.UTC(year.value, month.value - 1, activeDay.value)).toLocaleDateString(
    undefined,
    { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' }
  )
})

function selectDay(day: number, inMonth: boolean) {
  if (!inMonth || !eventsByDay.value.has(day)) {
    return
  }
  activeDay.value = day
}

onMounted(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  requestAnimationFrame(() => {
    animated.value = true
  })

  const days = featuredDays.value
  if (days.length) {
    // Prefer today when it has events; otherwise first featured day.
    const today = now.getDate()
    const sameMonth
      = now.getFullYear() === year.value && now.getMonth() + 1 === month.value
    activeDay.value
      = sameMonth && days.includes(today) ? today : (days[0] ?? null)

    if (!reduced) {
      let index = Math.max(0, days.indexOf(activeDay.value ?? days[0]!))
      cycleTimer = setInterval(() => {
        index = (index + 1) % days.length
        activeDay.value = days[index] ?? null
      }, 3200)
    }
  }
})

onBeforeUnmount(() => {
  if (cycleTimer) {
    clearInterval(cycleTimer)
  }
})
</script>

<template>
  <div
    class="showcase relative overflow-hidden rounded-3xl border border-default"
    :class="{ 'showcase--live': animated }"
    data-testid="landing-calendar-showcase"
  >
    <!-- Atmospheric layers -->
    <div
      class="showcase-orb showcase-orb--a pointer-events-none absolute -left-16 -top-20 size-56 rounded-full opacity-50 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="showcase-orb showcase-orb--b pointer-events-none absolute -bottom-24 -right-10 size-64 rounded-full opacity-40 blur-3xl"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--ui-bg)_0%,_transparent_55%)] opacity-80"
      aria-hidden="true"
    />

    <div class="relative grid gap-0 lg:grid-cols-[1.35fr_0.9fr]">
      <!-- Month grid -->
      <div class="border-b border-default p-5 sm:p-6 lg:border-b-0 lg:border-r">
        <div class="mb-5 flex items-end justify-between gap-3">
          <div>
            <p class="text-xs font-medium uppercase tracking-wider text-primary">
              Live preview
            </p>
            <h3 class="text-2xl font-semibold tracking-tight">
              {{ monthLabel }}
            </h3>
          </div>
          <div class="flex items-center gap-2 text-xs text-muted">
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-sm bg-primary" /> Due
            </span>
            <span class="inline-flex items-center gap-1.5">
              <span class="size-2 rounded-sm bg-warning" /> High
            </span>
          </div>
        </div>

        <div class="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted sm:gap-1.5">
          <span
            v-for="label in WEEKDAY_LABELS.monday"
            :key="label"
            class="py-1"
          >{{ label }}</span>
        </div>

        <div class="mt-1 grid grid-cols-7 gap-1 sm:gap-1.5">
          <button
            v-for="(cell, index) in grid"
            :key="cell.key"
            type="button"
            class="showcase-cell relative flex min-h-14 flex-col items-start gap-1 rounded-xl border p-1.5 text-left transition-colors sm:min-h-16 sm:p-2"
            :class="[
              cell.inMonth ? 'border-default/80 bg-default/70' : 'border-transparent bg-transparent opacity-35',
              cell.isToday ? 'ring-1 ring-primary/50' : '',
              activeDay === cell.day && cell.inMonth ? 'border-primary/50 bg-primary/5' : '',
              cell.inMonth && eventsByDay.has(cell.day) ? 'cursor-pointer hover:border-primary/40' : 'cursor-default'
            ]"
            :style="{ animationDelay: `${Math.min(index, 28) * 18}ms` }"
            :disabled="!cell.inMonth || !eventsByDay.has(cell.day)"
            :aria-pressed="activeDay === cell.day && cell.inMonth"
            @click="selectDay(cell.day, cell.inMonth)"
          >
            <span
              class="inline-flex size-6 items-center justify-center rounded-full text-xs"
              :class="cell.isToday ? 'bg-primary font-semibold text-white' : 'text-default'"
            >
              {{ cell.day }}
            </span>

            <span
              v-if="cell.inMonth && eventsByDay.has(cell.day)"
              class="showcase-dots mt-auto flex flex-wrap gap-0.5"
            >
              <span
                v-for="(event, eventIndex) in (eventsByDay.get(cell.day) ?? []).slice(0, 3)"
                :key="`${event.title}-${eventIndex}`"
                class="showcase-dot size-1.5 rounded-full"
                :class="priorityClass[event.priority]"
                :style="{ animationDelay: `${eventIndex * 120 + 400}ms` }"
              />
            </span>
          </button>
        </div>
      </div>

      <!-- Day detail rail -->
      <div class="flex flex-col justify-between gap-6 bg-elevated/40 p-5 sm:p-6">
        <div class="space-y-4">
          <div class="space-y-1">
            <p class="text-xs font-medium uppercase tracking-wider text-muted">
              On this day
            </p>
            <h4 class="text-lg font-semibold">
              {{ activeDayLabel || 'Pick a day' }}
            </h4>
          </div>

          <ul
            :key="activeDay ?? 'empty'"
            class="space-y-2"
          >
            <li
              v-for="(event, index) in activeEvents"
              :key="`${activeDay}-${event.title}`"
              class="showcase-event flex items-start gap-3 rounded-xl border border-default bg-default/80 px-3 py-2.5"
              :style="{ animationDelay: `${index * 90}ms` }"
            >
              <span
                class="mt-1.5 size-2 shrink-0 rounded-full"
                :class="priorityClass[event.priority]"
              />
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">
                  {{ event.title }}
                </p>
                <p class="text-xs capitalize text-muted">
                  {{ event.priority }} priority
                </p>
              </div>
            </li>
            <li
              v-if="!activeEvents.length"
              class="rounded-xl border border-dashed border-default px-3 py-6 text-center text-sm text-muted"
            >
              Free day — nothing due.
            </li>
          </ul>
        </div>

        <div class="showcase-caption space-y-2 rounded-2xl border border-default/80 bg-default/50 p-4">
          <p class="text-sm font-medium">
            Deadlines land where you can see them
          </p>
          <p class="text-xs leading-relaxed text-muted">
            Every due date in TaskFlow appears on your month grid. Spot packed days early,
            then rebalance before work becomes overdue.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.showcase {
  background:
    linear-gradient(145deg, color-mix(in oklab, var(--ui-bg) 88%, transparent), transparent 55%),
    color-mix(in oklab, var(--ui-bg-elevated) 65%, transparent);
}

.showcase-orb--a {
  background: color-mix(in oklab, var(--ui-primary) 35%, transparent);
}

.showcase-orb--b {
  background: color-mix(in oklab, var(--ui-primary) 22%, #0ea5e9 40%);
}

.showcase--live .showcase-orb--a {
  animation: showcase-drift 12s ease-in-out infinite alternate;
}

.showcase--live .showcase-orb--b {
  animation: showcase-drift 16s ease-in-out infinite alternate-reverse;
}

.showcase--live .showcase-cell {
  animation: showcase-cell-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.showcase--live .showcase-dot {
  animation: showcase-pop 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.showcase--live .showcase-event {
  animation: showcase-slide 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.showcase--live .showcase-caption {
  animation: showcase-slide 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both;
}

@keyframes showcase-drift {
  from {
    transform: translate3d(0, 0, 0) scale(1);
  }

  to {
    transform: translate3d(24px, 18px, 0) scale(1.08);
  }
}

@keyframes showcase-cell-in {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.97);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes showcase-pop {
  from {
    opacity: 0;
    transform: scale(0.2);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes showcase-slide {
  from {
    opacity: 0;
    transform: translateX(12px);
  }

  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .showcase-orb--a,
  .showcase-orb--b,
  .showcase-cell,
  .showcase-dot,
  .showcase-event,
  .showcase-caption {
    animation: none !important;
  }
}
</style>

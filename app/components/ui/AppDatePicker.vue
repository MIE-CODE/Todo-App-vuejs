<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { onClickOutside } from '@vueuse/core'

/**
 * Date picker with YYYY-MM-DD model (empty string = no date).
 * Calendar is presentational; conversion to ISO lives in shared date utils.
 */
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    testId?: string
    ariaLabel?: string
    min?: string
    max?: string
  }>(),
  {
    disabled: false
  }
)

const open = ref(false)
const rootRef = ref<HTMLElement | null>(null)
const panelRef = ref<HTMLElement | null>(null)
const view = ref(parseView(model.value))

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const
const PANEL_WIDTH = 288

const { panelStyle } = useFloatingPanel(rootRef, open, {
  width: PANEL_WIDTH,
  maxHeight: 360,
  zIndex: 200
})

const monthLabel = computed(() =>
  new Date(Date.UTC(view.value.year, view.value.month - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC'
  })
)

const displayValue = computed(() => {
  if (!model.value) {
    return ''
  }
  const [year, month, day] = model.value.split('-').map(Number)
  if (!year || !month || !day) {
    return model.value
  }
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  })
})

interface CalendarCell {
  key: string
  day: number
  inMonth: boolean
  selected: boolean
  isToday: boolean
  disabled: boolean
}

const cells = computed((): CalendarCell[] => {
  const { year, month } = view.value
  const first = new Date(Date.UTC(year, month - 1, 1))
  // Monday-start grid.
  const startDow = (first.getUTCDay() + 6) % 7
  const gridStart = new Date(first)
  gridStart.setUTCDate(first.getUTCDate() - startDow)

  const todayKey = toKey(new Date())
  const result: CalendarCell[] = []

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setUTCDate(gridStart.getUTCDate() + i)
    const key = toKey(date)
    result.push({
      key,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === month - 1,
      selected: key === model.value,
      isToday: key === todayKey,
      disabled: isOutOfRange(key)
    })
  }

  return result
})

function toKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseView(value: string): { year: number, month: number } {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-').map(Number)
    return { year: year!, month: month! }
  }
  const now = new Date()
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }
}

function isOutOfRange(key: string): boolean {
  if (props.min && key < props.min) {
    return true
  }
  if (props.max && key > props.max) {
    return true
  }
  return false
}

function close() {
  open.value = false
}

function openPicker() {
  if (props.disabled) {
    return
  }
  view.value = parseView(model.value)
  open.value = true
}

function toggle() {
  if (open.value) {
    close()
  } else {
    openPicker()
  }
}

function previousMonth() {
  const next = new Date(Date.UTC(view.value.year, view.value.month - 2, 1))
  view.value = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 }
}

function nextMonth() {
  const next = new Date(Date.UTC(view.value.year, view.value.month, 1))
  view.value = { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 }
}

function selectDay(cell: CalendarCell) {
  if (cell.disabled) {
    return
  }
  model.value = cell.key
  close()
}

function clearDate() {
  model.value = ''
  close()
}

function goToday() {
  const key = toKey(new Date())
  if (isOutOfRange(key)) {
    return
  }
  model.value = key
  view.value = parseView(key)
  close()
}

onClickOutside(
  rootRef,
  () => {
    if (open.value) {
      close()
    }
  },
  { ignore: [panelRef] }
)

async function focusTrigger() {
  await nextTick()
  rootRef.value?.querySelector<HTMLButtonElement>('button[data-datepicker-trigger]')?.focus()
}

defineExpose({ focusTrigger })
</script>

<template>
  <div
    ref="rootRef"
    class="relative w-full"
  >
    <div class="flex gap-1">
      <button
        type="button"
        data-datepicker-trigger
        class="flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-default bg-default px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60"
        :class="open ? 'ring-2 ring-primary' : 'hover:bg-muted/40'"
        :disabled="disabled"
        :aria-label="ariaLabel ?? 'Choose date'"
        :aria-expanded="open"
        :data-testid="testId"
        @click="toggle"
      >
        <span
          class="truncate"
          :class="model ? 'text-default' : 'text-muted'"
        >
          {{ displayValue || 'Pick a date' }}
        </span>
        <UIcon
          name="i-lucide-calendar"
          class="size-4 shrink-0 text-muted"
        />
      </button>
      <button
        v-if="model"
        type="button"
        class="rounded-md border border-default px-2 text-muted hover:bg-muted/40 hover:text-default"
        aria-label="Clear date"
        :disabled="disabled"
        @click="clearDate"
      >
        <UIcon
          name="i-lucide-x"
          class="size-4"
        />
      </button>
    </div>

    <Teleport to="body">
      <div
        v-if="open"
        ref="panelRef"
        class="overflow-auto rounded-xl border border-default bg-default p-3 shadow-lg"
        :style="panelStyle"
        role="dialog"
        aria-label="Calendar"
      >
        <div class="mb-3 flex items-center justify-between gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Previous month"
            @click="previousMonth"
          />
          <p class="text-sm font-semibold">
            {{ monthLabel }}
          </p>
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="ghost"
            size="sm"
            aria-label="Next month"
            @click="nextMonth"
          />
        </div>

        <div class="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted">
          <span
            v-for="day in WEEKDAYS"
            :key="day"
          >{{ day }}</span>
        </div>

        <div class="grid grid-cols-7 gap-1">
          <button
            v-for="cell in cells"
            :key="cell.key"
            type="button"
            class="flex size-8 items-center justify-center rounded-full text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="[
              cell.inMonth ? 'text-default' : 'text-muted/50',
              cell.selected ? 'bg-primary font-semibold text-white' : 'hover:bg-muted/60',
              cell.isToday && !cell.selected ? 'ring-1 ring-primary/40' : '',
              cell.disabled ? 'cursor-not-allowed opacity-30 hover:bg-transparent' : ''
            ]"
            :disabled="cell.disabled"
            :aria-pressed="cell.selected"
            @click="selectDay(cell)"
          >
            {{ cell.day }}
          </button>
        </div>

        <div class="mt-3 flex justify-between border-t border-default pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            size="xs"
            @click="clearDate"
          >
            Clear
          </UButton>
          <UButton
            color="primary"
            variant="soft"
            size="xs"
            @click="goToday"
          >
            Today
          </UButton>
        </div>
      </div>
    </Teleport>
  </div>
</template>

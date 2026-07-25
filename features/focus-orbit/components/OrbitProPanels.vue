<script setup lang="ts">
import type {
  OrbitRecommendation,
  RiskForecastPoint,
  WhatIfScenario
} from '#features/focus-orbit/types'

const props = defineProps<{
  forecast: RiskForecastPoint[] | null
  recommendations: OrbitRecommendation[] | null
  whatIf: WhatIfScenario | null
  capacityHours: number
}>()

const emit = defineEmits<{
  'update:capacityHours': [value: number]
}>()

const maxForecast = computed(() =>
  Math.max(1, ...(props.forecast?.map((point) => point.projectedOverdue) ?? [0]))
)
</script>

<template>
  <div
    class="grid gap-4 lg:grid-cols-3"
    data-testid="orbit-pro-panels"
  >
    <UCard>
      <template #header>
        <h3 class="font-semibold">
          Risk forecast
        </h3>
      </template>
      <div
        v-if="forecast"
        class="flex h-36 items-end gap-1.5"
      >
        <div
          v-for="point in forecast"
          :key="point.date"
          class="flex flex-1 flex-col items-center gap-1"
        >
          <div class="flex w-full flex-1 items-end">
            <div
              class="w-full rounded-t bg-rose-500/70"
              :style="{ height: `${(point.projectedOverdue / maxForecast) * 100}%` }"
            />
          </div>
          <span class="text-[10px] text-muted">
            {{ point.date.slice(8) }}
          </span>
        </div>
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        Pro unlocks 7-day overdue risk projection.
      </p>
    </UCard>

    <UCard>
      <template #header>
        <h3 class="font-semibold">
          Next best actions
        </h3>
      </template>
      <ul
        v-if="recommendations"
        class="space-y-3"
      >
        <li
          v-for="rec in recommendations"
          :key="rec.id"
          class="rounded-xl border border-default px-3 py-2.5"
        >
          <p class="text-sm font-medium">
            {{ rec.title }}
          </p>
          <p class="text-xs text-muted">
            {{ rec.reason }}
          </p>
        </li>
      </ul>
      <p
        v-else
        class="text-sm text-muted"
      >
        Pro surfaces ranked recommendations from your orbit.
      </p>
    </UCard>

    <UCard data-testid="what-if-controls">
      <template #header>
        <h3 class="font-semibold">
          What-if capacity
        </h3>
      </template>
      <div
        v-if="whatIf"
        class="space-y-4"
      >
        <UFormField
          :label="`Focus hours today: ${capacityHours}`"
          name="capacity"
        >
          <input
            :value="capacityHours"
            data-testid="capacity-slider"
            type="range"
            min="1"
            max="12"
            step="1"
            class="w-full accent-[var(--ui-primary)]"
            @input="emit('update:capacityHours', Number(($event.target as HTMLInputElement).value))"
          >
        </UFormField>
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div class="rounded-xl bg-elevated/50 p-3">
            <p class="text-xs text-muted">
              Completable
            </p>
            <p class="text-xl font-semibold tabular-nums">
              {{ whatIf.completableToday }}
            </p>
          </div>
          <div class="rounded-xl bg-elevated/50 p-3">
            <p class="text-xs text-muted">
              Leftover risk
            </p>
            <p class="text-xl font-semibold tabular-nums">
              {{ whatIf.leftoverRisk }}
            </p>
          </div>
        </div>
        <p class="text-sm text-muted">
          {{ whatIf.advice }}
        </p>
      </div>
      <p
        v-else
        class="text-sm text-muted"
      >
        Pro lets you simulate capacity before the day starts.
      </p>
    </UCard>
  </div>
</template>

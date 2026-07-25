<script setup lang="ts">
import type { CompletionPoint } from '#features/analytics/types'

const TRACK_HEIGHT_PX = 128
const MIN_BAR_PX = 4

const props = defineProps<{
  points: CompletionPoint[]
}>()

const maxCount = computed(() => Math.max(1, ...props.points.map(point => point.count)))

const totalCompleted = computed(() =>
  props.points.reduce((sum, point) => sum + point.count, 0)
)

const bars = computed(() =>
  props.points.map((point, index) => {
    const heightPx = point.count
      ? Math.max(MIN_BAR_PX, Math.round((point.count / maxCount.value) * TRACK_HEIGHT_PX))
      : MIN_BAR_PX

    return {
      ...point,
      index,
      heightPx,
      hasData: point.count > 0
    }
  })
)

function dayLabel(date: string) {
  return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
    weekday: 'short',
    timeZone: 'UTC'
  })
}
</script>

<template>
  <UCard data-testid="dashboard-completion-chart">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-chart-column"
            class="text-primary"
          />
          <h2 class="font-semibold">
            Completions
          </h2>
        </div>
        <span class="text-xs text-muted">
          Last 7 days · {{ totalCompleted }} done
        </span>
      </div>
    </template>

    <div class="flex items-end gap-2 sm:gap-3">
      <div
        v-for="bar in bars"
        :key="bar.date"
        class="flex min-w-0 flex-1 flex-col items-center gap-2"
      >
        <span class="h-4 text-xs tabular-nums text-muted">
          {{ bar.hasData ? bar.count : '' }}
        </span>

        <div
          class="relative flex w-full items-end justify-center"
          :style="{ height: `${TRACK_HEIGHT_PX}px` }"
        >
          <div
            class="dashboard-bar w-full max-w-10 rounded-t-md"
            :class="bar.hasData ? 'bg-primary' : 'bg-muted/50'"
            :style="{
              height: `${bar.heightPx}px`,
              animationDelay: `${bar.index * 60}ms`
            }"
            :title="`${bar.count} completed`"
          />
        </div>

        <span class="text-xs text-muted">
          {{ dayLabel(bar.date) }}
        </span>
      </div>
    </div>
  </UCard>
</template>

<style scoped>
.dashboard-bar {
  transform-origin: bottom;
  animation: dashboard-bar-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes dashboard-bar-in {
  from {
    transform: scaleY(0.12);
    opacity: 0.35;
  }

  to {
    transform: scaleY(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-bar {
    animation: none;
  }
}
</style>

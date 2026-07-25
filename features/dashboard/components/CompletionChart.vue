<script setup lang="ts">
import type { CompletionPoint } from '#features/analytics/types'

const props = defineProps<{
  points: CompletionPoint[]
}>()

const maxCount = computed(() => Math.max(1, ...props.points.map(point => point.count)))

const totalCompleted = computed(() =>
  props.points.reduce((sum, point) => sum + point.count, 0)
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

    <div class="flex h-44 items-end gap-2 sm:gap-3">
      <div
        v-for="(point, index) in points"
        :key="point.date"
        class="flex flex-1 flex-col items-center gap-2"
      >
        <span class="text-xs tabular-nums text-muted">
          {{ point.count || '' }}
        </span>
        <div class="flex h-32 w-full items-end justify-center">
          <div
            class="dashboard-bar w-full max-w-10 rounded-t-md bg-primary/80"
            :style="{
              height: `${Math.max(point.count ? 8 : 2, (point.count / maxCount) * 100)}%`,
              animationDelay: `${index * 60}ms`
            }"
            :title="`${point.count} completed`"
          />
        </div>
        <span class="text-xs text-muted">
          {{ dayLabel(point.date) }}
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

<script setup lang="ts">
import type { TaskPriority, TaskStatus } from '#shared/constants/app'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'

const props = defineProps<{
  priorityCounts: Record<TaskPriority, number>
  statusCounts: Record<TaskStatus, number>
}>()

const priorityMeta: Record<TaskPriority, { label: string, bar: string }> = {
  urgent: { label: 'Urgent', bar: 'bg-error' },
  high: { label: 'High', bar: 'bg-warning' },
  medium: { label: 'Medium', bar: 'bg-primary' },
  low: { label: 'Low', bar: 'bg-muted' }
}

const statusMeta: Record<TaskStatus, { label: string, bar: string }> = {
  todo: { label: 'To do', bar: 'bg-muted' },
  in_progress: { label: 'In progress', bar: 'bg-primary' },
  done: { label: 'Done', bar: 'bg-success' },
  archived: { label: 'Archived', bar: 'bg-muted/60' }
}

const priorityRows = computed(() => {
  const max = Math.max(1, ...TASK_PRIORITIES.map(key => props.priorityCounts[key] ?? 0))
  return TASK_PRIORITIES.map(key => ({
    key,
    ...priorityMeta[key],
    count: props.priorityCounts[key] ?? 0,
    width: ((props.priorityCounts[key] ?? 0) / max) * 100
  }))
})

const statusRows = computed(() => {
  const max = Math.max(1, ...TASK_STATUSES.map(key => props.statusCounts[key] ?? 0))
  return TASK_STATUSES.map(key => ({
    key,
    ...statusMeta[key],
    count: props.statusCounts[key] ?? 0,
    width: ((props.statusCounts[key] ?? 0) / max) * 100
  }))
})
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-2">
    <UCard data-testid="dashboard-priority-chart">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-flag"
            class="text-warning"
          />
          <h2 class="font-semibold">
            By priority
          </h2>
        </div>
      </template>

      <ul class="space-y-3">
        <li
          v-for="(row, index) in priorityRows"
          :key="row.key"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between gap-3 text-sm">
            <span>{{ row.label }}</span>
            <span class="tabular-nums text-muted">{{ row.count }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-muted/40">
            <div
              class="dashboard-hbar h-full rounded-full transition-[width]"
              :class="row.bar"
              :style="{
                width: `${row.width}%`,
                animationDelay: `${index * 70}ms`
              }"
            />
          </div>
        </li>
      </ul>
    </UCard>

    <UCard data-testid="dashboard-status-chart">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-layers"
            class="text-primary"
          />
          <h2 class="font-semibold">
            By status
          </h2>
        </div>
      </template>

      <ul class="space-y-3">
        <li
          v-for="(row, index) in statusRows"
          :key="row.key"
          class="space-y-1.5"
        >
          <div class="flex items-center justify-between gap-3 text-sm">
            <span>{{ row.label }}</span>
            <span class="tabular-nums text-muted">{{ row.count }}</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-muted/40">
            <div
              class="dashboard-hbar h-full rounded-full transition-[width]"
              :class="row.bar"
              :style="{
                width: `${row.width}%`,
                animationDelay: `${index * 70}ms`
              }"
            />
          </div>
        </li>
      </ul>
    </UCard>
  </div>
</template>

<style scoped>
.dashboard-hbar {
  transform-origin: left;
  animation: dashboard-hbar-in 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes dashboard-hbar-in {
  from {
    transform: scaleX(0.08);
    opacity: 0.35;
  }

  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dashboard-hbar {
    animation: none;
  }
}
</style>

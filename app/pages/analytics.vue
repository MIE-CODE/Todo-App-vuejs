<script setup lang="ts">
import { computed } from 'vue'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import { useAnalytics } from '#features/analytics/composables/useAnalytics'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Analytics · TaskFlow' })

const { data, pending, error, refresh } = await useAnalytics()

const maxCompletion = computed(() =>
  Math.max(1, ...(data.value?.completedLast7Days.map((point) => point.count) ?? [0]))
)

const statusLabels: Record<string, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
  archived: 'Archived'
}

const priorityColor: Record<string, string> = {
  urgent: 'bg-error',
  high: 'bg-warning',
  medium: 'bg-primary',
  low: 'bg-slate-400'
}

function weekdayLabel(dateKey: string): string {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' })
}
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-semibold">
        Analytics
      </h1>
      <p class="text-muted">
        Insights derived from your tasks.
      </p>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load analytics"
      :description="error.message"
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <template v-else-if="data">
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total tasks"
          :value="data.total"
          icon="i-lucide-layers"
          color="neutral"
        />
        <StatCard
          label="Completed"
          :value="data.completed"
          icon="i-lucide-check-check"
          color="success"
        />
        <StatCard
          label="Completion rate"
          :value="`${data.completionRate}%`"
          icon="i-lucide-percent"
          color="primary"
        />
        <StatCard
          label="Overdue"
          :value="data.overdue"
          icon="i-lucide-alarm-clock"
          color="error"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Completed in the last 7 days
            </h2>
          </template>
          <div class="flex h-40 items-end justify-between gap-2">
            <div
              v-for="point in data.completedLast7Days"
              :key="point.date"
              class="flex flex-1 flex-col items-center gap-2"
            >
              <div class="flex w-full flex-1 items-end">
                <div
                  class="w-full rounded-t bg-primary transition-all"
                  :style="{ height: `${(point.count / maxCompletion) * 100}%` }"
                  :title="`${point.count} completed`"
                />
              </div>
              <span class="text-xs text-muted">{{ weekdayLabel(point.date) }}</span>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              By status
            </h2>
          </template>
          <div class="space-y-3">
            <div
              v-for="status in TASK_STATUSES"
              :key="status"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span>{{ statusLabels[status] }}</span>
                <span class="tabular-nums text-muted">{{ data.statusCounts[status] }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full bg-primary"
                  :style="{ width: `${data.total ? (data.statusCounts[status] / data.total) * 100 : 0}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              By priority
            </h2>
          </template>
          <div class="space-y-3">
            <div
              v-for="priority in TASK_PRIORITIES"
              :key="priority"
            >
              <div class="mb-1 flex justify-between text-sm">
                <span class="capitalize">{{ priority }}</span>
                <span class="tabular-nums text-muted">{{ data.priorityCounts[priority] }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  class="h-full rounded-full"
                  :class="priorityColor[priority]"
                  :style="{ width: `${data.total ? (data.priorityCounts[priority] / data.total) * 100 : 0}%` }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="font-semibold">
              Top tags
            </h2>
          </template>
          <div
            v-if="data.topTags.length"
            class="flex flex-wrap gap-2"
          >
            <UBadge
              v-for="tag in data.topTags"
              :key="tag.tag"
              color="neutral"
              variant="soft"
              size="lg"
            >
              #{{ tag.tag }} · {{ tag.count }}
            </UBadge>
          </div>
          <p
            v-else
            class="py-4 text-center text-sm text-muted"
          >
            No tags yet. Add tags to your tasks to see them here.
          </p>
        </UCard>
      </div>
    </template>

    <AppSkeletonList
      v-else-if="pending"
      :rows="4"
    />
  </div>
</template>

<script setup lang="ts">
import { formatRelativeDue } from '#shared/utils/date'
import { useDashboard } from '#features/dashboard/composables/useDashboard'
import { useAuth } from '#features/auth/composables/useAuth'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Dashboard · TaskFlow' })

const { user } = useAuth()
const { data, pending, error, refresh } = await useDashboard()

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold">
          {{ greeting }}, {{ user?.name?.split(' ')[0] }}
        </h1>
        <p class="text-muted">
          Here's where things stand today.
        </p>
      </div>
      <UButton
        to="/tasks"
        icon="i-lucide-plus"
      >
        New task
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="subtle"
      title="Could not load your dashboard"
      :description="error.message"
      :actions="[{ label: 'Retry', onClick: () => refresh() }]"
    />

    <template v-else>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active tasks"
          :value="data?.summary.active ?? 0"
          icon="i-lucide-list-todo"
          color="primary"
        />
        <StatCard
          label="Due today"
          :value="data?.summary.dueToday ?? 0"
          icon="i-lucide-calendar-clock"
          color="warning"
        />
        <StatCard
          label="Overdue"
          :value="data?.summary.overdue ?? 0"
          icon="i-lucide-alarm-clock"
          color="error"
        />
        <StatCard
          label="Completion rate"
          :value="`${data?.summary.completionRate ?? 0}%`"
          icon="i-lucide-trophy"
          color="success"
          :hint="`${data?.summary.completed ?? 0} of ${data?.summary.total ?? 0} done`"
        />
      </div>

      <div
        v-if="data?.charts"
        class="space-y-6"
      >
        <CompletionChart :points="data.charts.completedLast7Days" />
        <BreakdownCharts
          :priority-counts="data.charts.priorityCounts"
          :status-counts="data.charts.statusCounts"
        />
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-alarm-clock"
                class="text-error"
              />
              <h2 class="font-semibold">
                Overdue
              </h2>
            </div>
          </template>

          <AppSkeletonList v-if="pending" />
          <p
            v-else-if="!data?.overdue.length"
            class="py-6 text-center text-sm text-muted"
          >
            Nothing overdue. Nicely done.
          </p>
          <ul
            v-else
            class="divide-y divide-default"
          >
            <li
              v-for="task in data.overdue"
              :key="task.id"
              class="flex items-center justify-between gap-3 py-3"
            >
              <NuxtLink
                :to="`/tasks/${task.id}`"
                class="min-w-0 flex-1 truncate font-medium hover:text-primary"
              >
                {{ task.title }}
              </NuxtLink>
              <span class="shrink-0 text-xs font-medium text-error">
                {{ formatRelativeDue(task.dueDate) }}
              </span>
            </li>
          </ul>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon
                name="i-lucide-calendar-days"
                class="text-primary"
              />
              <h2 class="font-semibold">
                Upcoming
              </h2>
            </div>
          </template>

          <AppSkeletonList v-if="pending" />
          <p
            v-else-if="!data?.upcoming.length"
            class="py-6 text-center text-sm text-muted"
          >
            No upcoming due dates.
          </p>
          <ul
            v-else
            class="divide-y divide-default"
          >
            <li
              v-for="task in data.upcoming"
              :key="task.id"
              class="flex items-center justify-between gap-3 py-3"
            >
              <NuxtLink
                :to="`/tasks/${task.id}`"
                class="min-w-0 flex-1 truncate font-medium hover:text-primary"
              >
                {{ task.title }}
              </NuxtLink>
              <span class="shrink-0 text-xs text-muted">
                {{ formatRelativeDue(task.dueDate) }}
              </span>
            </li>
          </ul>
        </UCard>
      </div>
    </template>
  </div>
</template>

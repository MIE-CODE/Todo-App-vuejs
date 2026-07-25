<script setup lang="ts">
import type { Task } from '#features/tasks/schemas/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import { useTaskStore } from '#features/tasks/stores/useTaskStore'

const store = useTaskStore()

const status = computed({
  get: () => store.filters.status ?? 'all',
  set: (value: string) => {
    store.setFilters({
      status: value === 'all' ? undefined : (value as Task['status'])
    })
  }
})

const priority = computed({
  get: () => store.filters.priority ?? 'all',
  set: (value: string) => {
    store.setFilters({
      priority: value === 'all' ? undefined : (value as Task['priority'])
    })
  }
})

const sortBy = computed({
  get: () => store.filters.sortBy,
  set: (value: typeof store.filters.sortBy) => {
    store.setFilters({ sortBy: value })
  }
})

const emit = defineEmits<{
  change: []
}>()

watch([status, priority, sortBy], () => {
  emit('change')
})

const statusOptions = [
  { label: 'Statuses', value: 'all' },
  ...TASK_STATUSES.map((value) => ({ label: value.replace('_', ' '), value }))
]

const priorityOptions = [
  { label: 'Priorities', value: 'all' },
  ...TASK_PRIORITIES.map((value) => ({ label: value, value }))
]

const sortOptions = [
  { label: 'Created', value: 'createdAt' },
  { label: 'Updated', value: 'updatedAt' },
  { label: 'Due date', value: 'dueDate' },
  { label: 'Priority', value: 'priority' },
  { label: 'Title', value: 'title' }
]
</script>

<template>
  <div class="grid gap-3 sm:grid-cols-3">
    <AppSelect
      v-model="status"
      test-id="filter-status"
      aria-label="Filter by status"
      :options="statusOptions"
    />
    <AppSelect
      v-model="priority"
      test-id="filter-priority"
      aria-label="Filter by priority"
      :options="priorityOptions"
    />
    <AppSelect
      v-model="sortBy"
      test-id="filter-sort"
      aria-label="Sort tasks"
      :options="sortOptions"
    />
  </div>
</template>

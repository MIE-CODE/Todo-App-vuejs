<script setup lang="ts">
import type { BoardStatus, TasksByStatus } from '#features/tasks/utils/groupByStatus'
import { BOARD_STATUSES } from '#features/tasks/utils/groupByStatus'

defineProps<{
  columns: TasksByStatus
}>()

defineEmits<{
  /** Reserved if parent needs column-level events later. */
  noop: []
}>()

const statuses = BOARD_STATUSES as readonly BoardStatus[]
</script>

<template>
  <div
    class="flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible"
    data-testid="task-kanban"
    aria-label="Task board"
  >
    <TaskColumn
      v-for="status in statuses"
      :key="status"
      :status="status"
      :tasks="columns[status]"
    />
  </div>
</template>

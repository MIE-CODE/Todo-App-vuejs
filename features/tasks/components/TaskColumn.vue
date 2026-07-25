<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Task } from '#features/tasks/schemas/task'
import { useTaskBoard } from '#features/tasks/composables/useTaskBoard'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'
import { BOARD_STATUS_LABELS } from '#features/tasks/utils/groupByStatus'

const props = defineProps<{
  status: BoardStatus
  tasks: Task[]
}>()

const { moveTaskById, selectAllInColumn, deselectInColumn, selectedIds } = useTaskBoard()

const dragOver = ref(false)

const columnIds = computed(() => props.tasks.map((task) => task.id))

const allSelected = computed(
  () =>
    columnIds.value.length > 0
    && columnIds.value.every((id) => selectedIds.value.includes(id))
)

const someSelected = computed(
  () =>
    columnIds.value.some((id) => selectedIds.value.includes(id)) && !allSelected.value
)

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOver.value = true
}

function onDragLeave() {
  dragOver.value = false
}

async function onDrop(event: DragEvent) {
  event.preventDefault()
  dragOver.value = false

  const taskId
    = event.dataTransfer?.getData('application/x-taskflow-task')
      || event.dataTransfer?.getData('text/task-id')

  if (!taskId) {
    return
  }

  await moveTaskById(taskId, props.status)
}

function onToggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked
  if (checked) {
    selectAllInColumn(columnIds.value)
  } else {
    deselectInColumn(columnIds.value)
  }
}
</script>

<template>
  <section
    class="flex min-h-[28rem] min-w-[280px] flex-1 flex-col rounded-xl border bg-muted/20"
    :class="dragOver ? 'border-primary bg-primary/5' : 'border-default'"
    :data-testid="`column-${status}`"
    :data-status="status"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <header class="flex items-center gap-2 border-b border-default px-3 py-2.5">
      <input
        type="checkbox"
        class="size-4 shrink-0 accent-primary disabled:opacity-40"
        :checked="allSelected"
        :indeterminate="someSelected"
        :disabled="!tasks.length"
        :aria-label="`Select all in ${BOARD_STATUS_LABELS[status]}`"
        data-testid="column-select-all"
        @change="onToggleSelectAll"
      >
      <h2 class="text-sm font-semibold">
        {{ BOARD_STATUS_LABELS[status] }}
      </h2>
      <UBadge
        color="neutral"
        variant="subtle"
        size="sm"
      >
        {{ tasks.length }}
      </UBadge>
    </header>

    <div class="flex flex-1 flex-col gap-2 overflow-y-auto p-2">
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
      />

      <p
        v-if="!tasks.length"
        class="px-2 py-8 text-center text-sm text-muted"
      >
        Drop tasks here
      </p>
    </div>
  </section>
</template>

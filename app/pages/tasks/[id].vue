<script setup lang="ts">
import { formatDateTime } from '#shared/utils/date'
import { useTaskDetail } from '#features/tasks/composables/useTaskDetail'

definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const taskId = computed(() => String(route.params.id))

const { data: task, pending, error, saving, removing, save, remove } = useTaskDetail(taskId)

useSeoMeta({
  title: () => (task.value ? `${task.value.title} · TaskFlow` : 'Task · TaskFlow')
})
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <UButton
      to="/tasks"
      color="neutral"
      variant="ghost"
      icon="i-lucide-arrow-left"
    >
      Back to tasks
    </UButton>

    <AppSkeletonList
      v-if="pending"
      :rows="4"
    />

    <UAlert
      v-else-if="error"
      color="error"
      title="Task not found"
      :description="error.message"
      icon="i-lucide-triangle-alert"
      :actions="[{ label: 'Back to tasks', to: '/tasks' }]"
    />

    <template v-else-if="task">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold">
            Edit task
          </h1>
          <p class="text-sm text-muted">
            Last updated {{ formatDateTime(task.updatedAt) }}
          </p>
        </div>
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          :loading="removing"
          data-testid="edit-delete"
          @click="remove"
        >
          Delete
        </UButton>
      </div>

      <UCard>
        <TaskEditForm
          :task="task"
          :saving="saving"
          @save="save"
        />
      </UCard>
    </template>
  </div>
</template>

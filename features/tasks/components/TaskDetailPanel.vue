<script setup lang="ts">
import type { Task } from '#features/tasks/schemas/task'
import { formatDate } from '#shared/utils/date'

/**
 * Dumb detail panel.
 * Receives task via props; emits intent events upward.
 */
defineProps<{
  task: Task | null
}>()

const emit = defineEmits<{
  close: []
  toggleDone: [task: Task]
  remove: [task: Task]
}>()
</script>

<template>
  <aside
    class="rounded-xl border border-default bg-default p-4 shadow-sm"
    aria-live="polite"
  >
    <div
      v-if="!task"
      class="flex h-full min-h-48 flex-col items-center justify-center gap-2 text-center text-muted"
    >
      <UIcon
        name="i-lucide-panel-right-open"
        class="size-8"
      />
      <p class="text-sm">
        Select a task to inspect details.
      </p>
    </div>

    <div
      v-else
      class="space-y-4"
    >
      <div class="flex items-start justify-between gap-3">
        <div>
          <p class="text-xs uppercase tracking-wide text-muted">
            Task detail
          </p>
          <h2 class="text-xl font-semibold">
            {{ task.title }}
          </h2>
        </div>
        <UButton
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          aria-label="Close detail panel"
          @click="emit('close')"
        />
      </div>

      <p class="text-sm text-muted">
        {{ task.description || 'No description provided.' }}
      </p>

      <dl class="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt class="text-muted">
            Status
          </dt>
          <dd class="font-medium">
            {{ task.status }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Priority
          </dt>
          <dd class="font-medium">
            {{ task.priority }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Due date
          </dt>
          <dd class="font-medium">
            {{ formatDate(task.dueDate) }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Updated
          </dt>
          <dd class="font-medium">
            {{ formatDate(task.updatedAt) }}
          </dd>
        </div>
      </dl>

      <div class="flex flex-wrap gap-2">
        <UButton
          :icon="task.status === 'done' ? 'i-lucide-rotate-ccw' : 'i-lucide-check'"
          @click="emit('toggleDone', task)"
        >
          {{ task.status === 'done' ? 'Reopen' : 'Complete' }}
        </UButton>
        <UButton
          :to="`/tasks/${task.id}`"
          color="neutral"
          variant="soft"
          icon="i-lucide-pencil"
        >
          Edit
        </UButton>
        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          @click="emit('remove', task)"
        >
          Delete
        </UButton>
      </div>
    </div>
  </aside>
</template>

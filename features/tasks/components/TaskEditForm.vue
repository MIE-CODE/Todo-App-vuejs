<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { Task, UpdateTaskInput } from '#features/tasks/schemas/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import { fromDateInputValue, toDateInputValue } from '#shared/utils/date'

const props = defineProps<{
  task: Task
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [input: Omit<UpdateTaskInput, 'version'>]
}>()

const form = reactive({
  title: props.task.title,
  description: props.task.description ?? '',
  status: props.task.status,
  priority: props.task.priority,
  dueDate: toDateInputValue(props.task.dueDate),
  tags: props.task.tags.join(', ')
})

const statusOptions = TASK_STATUSES.map((value) => ({
  label: value.replace('_', ' '),
  value
}))

const priorityOptions = TASK_PRIORITIES.map((value) => ({
  label: value,
  value
}))

// Re-sync when the task reloads (e.g. after a 409 conflict refresh).
watch(
  () => props.task,
  (task) => {
    form.title = task.title
    form.description = task.description ?? ''
    form.status = task.status
    form.priority = task.priority
    form.dueDate = toDateInputValue(task.dueDate)
    form.tags = task.tags.join(', ')
  }
)

const titleError = ref('')

function onSubmit() {
  titleError.value = ''
  if (!form.title.trim()) {
    titleError.value = 'Title is required'
    return
  }

  const tags = form.tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    status: form.status,
    priority: form.priority,
    dueDate: fromDateInputValue(form.dueDate),
    tags
  })
}
</script>

<template>
  <form
    class="space-y-4"
    novalidate
    @submit.prevent="onSubmit"
  >
    <UFormField
      label="Title"
      name="title"
      :error="titleError"
    >
      <UInput
        v-model="form.title"
        data-testid="edit-title"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Description"
      name="description"
    >
      <UTextarea
        v-model="form.description"
        autoresize
        :rows="4"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField
        label="Status"
        name="status"
      >
        <AppSelect
          v-model="form.status"
          test-id="edit-status-select"
          aria-label="Status"
          :options="statusOptions"
        />
      </UFormField>

      <UFormField
        label="Priority"
        name="priority"
      >
        <AppSelect
          v-model="form.priority"
          test-id="edit-priority-select"
          aria-label="Priority"
          :options="priorityOptions"
        />
      </UFormField>

      <UFormField
        label="Due date"
        name="dueDate"
      >
        <AppDatePicker
          v-model="form.dueDate"
          test-id="edit-due-input"
          aria-label="Due date"
        />
      </UFormField>
    </div>

    <UFormField
      label="Tags"
      name="tags"
      hint="Comma-separated"
    >
      <UInput
        v-model="form.tags"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end">
      <UButton
        type="submit"
        icon="i-lucide-save"
        :loading="saving"
        data-testid="edit-save"
      >
        Save changes
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { Task, UpdateTaskInput } from '#features/tasks/schemas/task'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import { fromDateInputValue, toDateInputValue, toTimeInputValue } from '#shared/utils/date'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

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
  dueTime: toTimeInputValue(props.task.dueTime),
  tags: props.task.tags.join(', ')
})

const auth = useAuthStore()
/** Due times and alarms are a Plus/Pro entitlement; Free sees a locked control. */
const canUseReminders = computed(
  () => auth.user?.entitlements.includes('task_reminders') ?? false
)

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
    form.dueTime = toTimeInputValue(task.dueTime)
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

  // A time is meaningless without a date, and only Plus/Pro may set one.
  const effectiveTime
    = canUseReminders.value && form.dueDate && form.dueTime ? form.dueTime : null

  emit('save', {
    title: form.title.trim(),
    description: form.description.trim() ? form.description.trim() : null,
    status: form.status,
    priority: form.priority,
    dueDate: fromDateInputValue(form.dueDate),
    dueTime: effectiveTime,
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

    <UFormField name="dueTime">
      <template #label>
        <span class="flex items-center gap-2">
          Due time
          <UBadge
            v-if="!canUseReminders"
            size="sm"
            color="primary"
            variant="subtle"
          >
            Plus
          </UBadge>
        </span>
      </template>
      <template #hint>
        <span class="text-xs text-muted">
          Rings a 30s alarm when due
        </span>
      </template>

      <AppTimePicker
        v-if="canUseReminders"
        v-model="form.dueTime"
        test-id="edit-due-time-input"
        aria-label="Due time"
      />
      <div
        v-else
        class="flex flex-wrap items-center justify-between gap-2 rounded-md border border-dashed border-default bg-muted/20 px-3 py-2 text-sm text-muted"
      >
        <span class="flex items-center gap-2">
          <UIcon
            name="i-lucide-lock"
            class="size-4"
          />
          Set due times &amp; alarms with Plus or Pro
        </span>
        <UButton
          to="/settings"
          size="xs"
          color="primary"
          variant="soft"
        >
          Upgrade
        </UButton>
      </div>
    </UFormField>

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

<script setup lang="ts">
import { computed } from 'vue'
import type { CreateTaskInput } from '#features/tasks/schemas/task'
import { createTaskSchema } from '#features/tasks/schemas/task'
import { TASK_PRIORITIES } from '#shared/constants/app'
import { fromDateInputValue } from '#shared/utils/date'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

const props = defineProps<{
  /**
   * Async submit handler so the form can await success before reset.
   * Prefer this over fire-and-forget emits for create flows.
   */
  submitHandler?: (input: CreateTaskInput) => Promise<boolean> | boolean
  /** Seeds the priority select from the user's saved default. */
  defaultPriority?: CreateTaskInput['priority']
}>()

const emit = defineEmits<{
  submit: [input: CreateTaskInput]
}>()

const title = ref('')
const description = ref('')
type CreateStatus = Exclude<CreateTaskInput['status'], 'archived'>

const priority = ref<CreateTaskInput['priority']>('medium')
const status = ref<CreateStatus>('todo')
const dueDate = ref('')
const dueTime = ref('')
const tagsInput = ref('')
const fieldErrors = ref<Record<string, string>>({})
const submitting = ref(false)

const auth = useAuthStore()
/** Due times and alarms are a Plus/Pro entitlement; Free sees a locked control. */
const canUseReminders = computed(
  () => auth.user?.entitlements.includes('task_reminders') ?? false
)

const priorityOptions = TASK_PRIORITIES.map((value) => ({
  label: value,
  value
}))

const statusOptions = [
  { label: 'todo', value: 'todo' },
  { label: 'in progress', value: 'in_progress' },
  { label: 'done', value: 'done' }
]

if (props.defaultPriority) {
  priority.value = props.defaultPriority
}

function reset() {
  title.value = ''
  description.value = ''
  priority.value = props.defaultPriority ?? 'medium'
  status.value = 'todo'
  dueDate.value = ''
  dueTime.value = ''
  tagsInput.value = ''
  fieldErrors.value = {}
}

async function onSubmit() {
  const tags = tagsInput.value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  // A time is meaningless without a date, and only Plus/Pro may set one.
  const effectiveTime
    = canUseReminders.value && dueDate.value && dueTime.value ? dueTime.value : null

  const parsed = createTaskSchema.safeParse({
    title: title.value,
    description: description.value || null,
    priority: priority.value,
    status: status.value,
    dueDate: fromDateInputValue(dueDate.value),
    dueTime: effectiveTime,
    tags
  })

  if (!parsed.success) {
    const nextErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? '_form')
      if (!nextErrors[key]) {
        nextErrors[key] = issue.message
      }
    }
    fieldErrors.value = nextErrors
    await nextTick()
    document.querySelector<HTMLInputElement>('[data-testid="task-title-input"]')?.focus()
    return
  }

  fieldErrors.value = {}
  submitting.value = true

  try {
    if (props.submitHandler) {
      const result = await props.submitHandler(parsed.data)
      if (result === false) {
        return
      }
    } else {
      emit('submit', parsed.data)
    }
    reset()
  } finally {
    submitting.value = false
  }
}

defineExpose({
  reset,
  focusTitle: async () => {
    await nextTick()
    document.querySelector<HTMLInputElement>('[data-testid="task-title-input"]')?.focus()
  }
})
</script>

<template>
  <form
    class="space-y-4 rounded-xl border border-default bg-default p-4 shadow-sm"
    @submit.prevent="onSubmit"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-lg font-semibold">
        New task
      </h2>
    </div>

    <UFormField
      label="Title"
      name="title"
      :error="fieldErrors.title"
    >
      <!--
        Native input keeps v-model + Playwright deterministic.
        Design-system inputs are great UX, but E2E should target a stable control.
      -->
      <input
        v-model="title"
        type="text"
        name="title"
        data-testid="task-title-input"
        class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
        placeholder="e.g. Prepare the weekly report"
      >
    </UFormField>

    <UFormField
      label="Description"
      name="description"
      :error="fieldErrors.description"
    >
      <UTextarea
        v-model="description"
        autoresize
        :rows="3"
        placeholder="Optional details or notes…"
        class="w-full"
      />
    </UFormField>

    <div class="grid gap-4 sm:grid-cols-3">
      <UFormField
        label="Priority"
        name="priority"
      >
        <AppSelect
          v-model="priority"
          test-id="task-priority-select"
          aria-label="Priority"
          :options="priorityOptions"
        />
      </UFormField>

      <UFormField
        label="Status"
        name="status"
      >
        <AppSelect
          v-model="status"
          test-id="task-status-select"
          aria-label="Status"
          :options="statusOptions"
        />
      </UFormField>

      <UFormField
        label="Due date"
        name="dueDate"
      >
        <AppDatePicker
          v-model="dueDate"
          test-id="task-due-input"
          aria-label="Due date"
        />
      </UFormField>
    </div>

    <UFormField
      name="dueTime"
      :error="fieldErrors.dueTime"
    >
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
        v-model="dueTime"
        test-id="task-due-time-input"
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
      :error="fieldErrors.tags"
    >
      <UInput
        v-model="tagsInput"
        placeholder="work, home, errands"
        class="w-full"
      />
    </UFormField>

    <div class="flex justify-end gap-2">
      <UButton
        type="button"
        color="neutral"
        variant="ghost"
        @click="reset"
      >
        Clear
      </UButton>
      <button
        type="submit"
        data-testid="task-submit"
        class="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
        :disabled="submitting"
      >
        Add task
      </button>
    </div>
  </form>
</template>

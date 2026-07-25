<script setup lang="ts">
import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { useMediaQuery, usePointerSwipe } from '@vueuse/core'
import type { Task } from '#features/tasks/schemas/task'
import { useTaskBoard } from '#features/tasks/composables/useTaskBoard'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'
import { BOARD_STATUSES, BOARD_STATUS_LABELS } from '#features/tasks/utils/groupByStatus'
import { formatRelativeDue } from '#shared/utils/date'

const props = defineProps<{
  task: Task
}>()

const {
  selectedId,
  select,
  isMultiSelected,
  toggleDone,
  remove,
  moveToStatus,
  rename
} = useTaskBoard()

const cardRef = ref<HTMLElement | null>(null)
const titleInputRef = ref<HTMLInputElement | null>(null)
const editing = ref(false)
const draftTitle = ref(props.task.title)
const swipeOffset = ref(0)
const revealDelete = ref(false)

const isCoarsePointer = useMediaQuery('(pointer: coarse)')
const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')

const isSelected = computed(() => selectedId.value === props.task.id)
const isChecked = computed(() => isMultiSelected(props.task.id))
const multiSelectActive = computed(() => {
  // Parent selection list length is not injected; treat checkbox mode when any selected elsewhere
  // via the checked state or when coarse pointer multi-select is intentional.
  return isChecked.value
})

const isActive = computed(
  () => props.task.status !== 'done' && props.task.status !== 'archived'
)

const isOverdue = computed(
  () =>
    Boolean(props.task.dueDate)
    && isActive.value
    && new Date(props.task.dueDate as string).getTime() < Date.now()
)

const priorityColor = computed(() => {
  switch (props.task.priority) {
    case 'urgent':
      return 'error'
    case 'high':
      return 'warning'
    case 'medium':
      return 'info'
    default:
      return 'neutral'
  }
})

const statusOptions = BOARD_STATUSES.map((value) => ({
  label: BOARD_STATUS_LABELS[value],
  value
}))

const statusModel = computed({
  get: () => (props.task.status === 'archived' ? 'todo' : props.task.status),
  set: (value: string) => {
    void moveToStatus(props.task, value as BoardStatus)
  }
})

watch(
  () => props.task.title,
  (title) => {
    if (!editing.value) {
      draftTitle.value = title
    }
  }
)

function onCardClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null
  if (target?.closest('[data-no-select]')) {
    return
  }
  select(props.task.id)
}

function onKeydown(event: KeyboardEvent) {
  if (editing.value) {
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    void startInlineEdit()
    return
  }

  if (event.key === ' ') {
    event.preventDefault()
    select(props.task.id)
  }

  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    void remove(props.task)
  }
}

async function startInlineEdit() {
  editing.value = true
  draftTitle.value = props.task.title
  await nextTick()
  titleInputRef.value?.focus()
  titleInputRef.value?.select()
}

async function commitInlineEdit() {
  if (!editing.value) {
    return
  }
  editing.value = false
  await rename(props.task, draftTitle.value)
  draftTitle.value = props.task.title
}

function cancelInlineEdit() {
  editing.value = false
  draftTitle.value = props.task.title
}

function onTitleKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter') {
    event.preventDefault()
    void commitInlineEdit()
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    cancelInlineEdit()
  }
}

function onDragStart(event: DragEvent) {
  if (editing.value) {
    event.preventDefault()
    return
  }
  event.dataTransfer?.setData('text/task-id', props.task.id)
  event.dataTransfer?.setData('application/x-taskflow-task', props.task.id)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
  cardRef.value?.classList.add('opacity-60')
}

function onDragEnd() {
  cardRef.value?.classList.remove('opacity-60')
}

const { distanceX } = usePointerSwipe(cardRef, {
  threshold: 40,
  onSwipe() {
    if (!isCoarsePointer.value || prefersReducedMotion.value || editing.value) {
      return
    }
    // Cap the visual offset so the card doesn't fly off-screen.
    swipeOffset.value = Math.max(-96, Math.min(96, distanceX.value))
  },
  onSwipeEnd() {
    if (!isCoarsePointer.value || prefersReducedMotion.value || editing.value) {
      swipeOffset.value = 0
      return
    }

    if (distanceX.value > 64) {
      void toggleDone(props.task)
      revealDelete.value = false
    } else if (distanceX.value < -64) {
      revealDelete.value = true
    } else {
      revealDelete.value = false
    }
    swipeOffset.value = 0
  }
})

onMounted(() => {
  // Touch devices: disable HTML5 drag to avoid fighting swipe.
  if (isCoarsePointer.value && cardRef.value) {
    cardRef.value.draggable = false
  }
})

onBeforeUnmount(() => {
  swipeOffset.value = 0
})
</script>

<template>
  <div class="relative">
    <!-- Swipe action rails (mobile) -->
    <div
      class="pointer-events-none absolute inset-0 flex overflow-hidden rounded-xl"
      aria-hidden="true"
    >
      <div class="flex w-1/2 items-center bg-success/20 px-3 text-success">
        <UIcon
          name="i-lucide-check"
          class="size-5"
        />
      </div>
      <div class="ml-auto flex w-1/2 items-center justify-end bg-error/20 px-3 text-error">
        <UIcon
          name="i-lucide-trash-2"
          class="size-5"
        />
      </div>
    </div>

    <article
      ref="cardRef"
      class="group relative rounded-xl border bg-default p-3 shadow-sm transition-colors focus-within:ring-2 focus-within:ring-primary"
      :class="[
        isSelected ? 'border-primary bg-primary/5' : 'border-default hover:bg-muted/30',
        isChecked ? 'ring-1 ring-primary/40' : '',
        prefersReducedMotion ? '' : 'transition-transform'
      ]"
      :style="swipeOffset ? { transform: `translateX(${swipeOffset}px)` } : undefined"
      role="article"
      :aria-current="isSelected ? 'true' : undefined"
      tabindex="0"
      draggable="true"
      :data-testid="`task-card-${task.id}`"
      :data-task-id="task.id"
      @click="onCardClick"
      @dblclick.stop="startInlineEdit"
      @keydown="onKeydown"
      @dragstart="onDragStart"
      @dragend="onDragEnd"
    >
      <div class="flex items-start gap-2">
        <UCheckbox
          data-no-select
          :model-value="task.status === 'done'"
          :aria-label="`Mark ${task.title} as ${task.status === 'done' ? 'todo' : 'done'}`"
          @click.stop
          @update:model-value="toggleDone(task)"
        />

        <div class="min-w-0 flex-1 space-y-1.5">
          <div class="flex flex-wrap items-center gap-2">
            <input
              v-if="editing"
              ref="titleInputRef"
              v-model="draftTitle"
              data-no-select
              data-testid="inline-title-input"
              class="w-full rounded-md border border-primary bg-default px-2 py-1 text-sm font-medium outline-none"
              @click.stop
              @keydown="onTitleKeydown"
              @blur="commitInlineEdit"
            >
            <h3
              v-else
              class="truncate font-medium"
              :class="task.status === 'done' ? 'text-muted line-through' : ''"
              :title="'Double-click to rename'"
            >
              {{ task.title }}
            </h3>
            <UBadge
              :color="priorityColor"
              variant="subtle"
              size="sm"
            >
              {{ task.priority }}
            </UBadge>
          </div>

          <p
            v-if="task.description"
            class="line-clamp-2 text-sm text-muted"
          >
            {{ task.description }}
          </p>

          <div
            data-no-select
            class="flex flex-wrap items-center gap-2 pt-0.5"
            @click.stop
          >
            <div class="w-36">
              <AppSelect
                v-model="statusModel"
                :options="statusOptions"
                :test-id="`task-status-${task.id}`"
                aria-label="Move task"
              />
            </div>

            <span
              v-if="task.dueDate"
              class="inline-flex items-center gap-1 text-xs"
              :class="isOverdue ? 'font-medium text-error' : 'text-muted'"
            >
              <UIcon
                name="i-lucide-calendar"
                class="size-3.5"
              />
              {{ formatRelativeDue(task.dueDate) }}
            </span>

            <UBadge
              v-for="tag in task.tags"
              :key="tag"
              color="neutral"
              variant="soft"
              size="sm"
            >
              #{{ tag }}
            </UBadge>
          </div>
        </div>

        <UButton
          data-no-select
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="sm"
          aria-label="Delete task"
          class="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 sm:opacity-0"
          :class="revealDelete || multiSelectActive ? '!opacity-100' : ''"
          @click.stop="remove(task)"
        />
      </div>
    </article>
  </div>
</template>

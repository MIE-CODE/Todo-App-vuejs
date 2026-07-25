<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { CreateTaskInput, Task } from '#features/tasks/schemas/task'
import { provideTaskBoard } from '#features/tasks/composables/useTaskBoard'
import { useTasks } from '#features/tasks/composables/useTasks'
import { useAppToast } from '#shared/composables/useAppToast'
import { useAuth } from '#features/auth/composables/useAuth'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'
import type { PaginatedResult } from '#shared/types/api'

/**
 * Smart container: owns data orchestration and provide/inject context.
 * Child components remain mostly presentational.
 */
const {
  store,
  search,
  pagination,
  columns,
  selected,
  isEmpty,
  refresh,
  create,
  toggleDone,
  moveToStatus,
  rename,
  remove,
  undo,
  bulkComplete,
  bulkDelete,
  bulkMove
} = useTasks()

const toast = useAppToast()
const { preferences } = useAuth()
const defaultPriority = computed(() => preferences.value?.defaultPriority ?? 'medium')
const showCreate = ref(true)
const formRef = ref<{ focusTitle: () => Promise<void> } | null>(null)
const bulkPending = ref(false)

const selectedIds = computed(() => store.selectedIds)

provideTaskBoard({
  selectedId: computed(() => store.selectedId),
  selectedIds,
  select: (taskId) => store.selectTask(taskId),
  toggleMultiSelect: (taskId) => store.toggleSelectedId(taskId),
  isMultiSelected: (taskId) => store.selectedIds.includes(taskId),
  toggleDone,
  remove,
  moveToStatus,
  moveTaskById: async (taskId, status) => {
    const task = store.items.find((item) => item.id === taskId)
    if (!task) {
      return
    }
    await moveToStatus(task, status)
  },
  rename,
  selectAllInColumn: (taskIds) => store.selectAllIn(taskIds),
  deselectInColumn: (taskIds) => store.deselectIds(taskIds)
})

const { $api } = useNuxtApp()

const {
  data,
  pending,
  error,
  refresh: refreshAsyncData
} = await useAsyncData(
  'tasks-board',
  () =>
    $api<PaginatedResult<Task>>('/api/tasks', {
      query: {
        page: 1,
        pageSize: 100,
        search: store.search || undefined,
        status: store.filters.status,
        priority: store.filters.priority,
        tag: store.filters.tag,
        sortBy: store.filters.sortBy,
        sortDir: store.filters.sortDir
      }
    }),
  {
    watch: []
  }
)

/**
 * Hydrate Pinia from the SSR payload so server HTML and client store match.
 * Mutating the store inside the fetcher causes empty-client hydration mismatches.
 */
watch(
  data,
  (value) => {
    if (!value) {
      return
    }
    store.items = value.data
    store.meta = value.meta
    pagination.setTotal(value.meta.total)
    pagination.page.value = value.meta.page
  },
  { immediate: true }
)

async function onCreate(input: CreateTaskInput) {
  const created = await create(input)
  if (!created) {
    return false
  }
  await refreshAsyncData()
  return true
}

async function onFiltersChange() {
  pagination.reset()
  await refresh(1)
  await refreshAsyncData()
}

async function onUndo() {
  await undo()
  await refreshAsyncData()
}

function onCloseDetail() {
  store.selectTask(null)
}

async function onToggleFromDetail(task: Task) {
  await toggleDone(task)
  await refreshAsyncData()
}

async function onRemoveFromDetail(task: Task) {
  await remove(task)
  store.selectTask(null)
  await refreshAsyncData()
}

async function onBulkComplete() {
  bulkPending.value = true
  try {
    await bulkComplete()
  } finally {
    bulkPending.value = false
  }
}

async function onBulkDelete() {
  bulkPending.value = true
  try {
    await bulkDelete()
  } finally {
    bulkPending.value = false
  }
}

async function onBulkMove(status: BoardStatus) {
  bulkPending.value = true
  try {
    await bulkMove(status)
  } finally {
    bulkPending.value = false
  }
}

onMounted(() => {
  useEventListener('keydown', (event: KeyboardEvent) => {
    const target = event.target as HTMLElement | null
    const typing =
      target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable

    if (typing) {
      return
    }

    if (event.key === 'n') {
      event.preventDefault()
      showCreate.value = true
      void formRef.value?.focusTitle()
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()
      void onUndo()
    }

    if (event.key === 'Escape' && store.selectedIds.length) {
      store.clearSelection()
    }
  })
})

watchEffect(() => {
  if (error.value) {
    toast.error('Failed to load tasks', error.value.message)
  }
})

useSeoMeta({
  title: 'Tasks · TaskFlow',
  description: 'Create, organize, and complete your tasks with priorities, due dates, and tags.'
})
</script>

<template>
  <div class="space-y-6">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Tasks</h1>
        <p class="mt-1 max-w-2xl text-sm text-muted">
          Drag between columns · double-click to rename ·
          <kbd class="rounded border px-1">n</kbd> to add ·
          <kbd class="rounded border px-1">⌘/Ctrl+Z</kbd> to undo
        </p>
      </div>

      <div class="flex items-center gap-2">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-undo-2"
          :disabled="!store.lastDeleted"
          @click="onUndo"
        >
          Undo
        </UButton>
        <UButton
          :icon="!showCreate ? 'i-lucide-chevron-up' : 'i-lucide-plus'"
          variant="soft"
          @click="showCreate = !showCreate"
        >
          {{ !showCreate ? 'Hide form' : 'New task' }}
        </UButton>
      </div>
    </header>

    <ClientOnly>
      <KeepAlive>
        <TaskCreateForm
          v-if="!showCreate"
          ref="formRef"
          :submit-handler="onCreate"
          :default-priority="defaultPriority"
          @submit="onCreate"
        />
      </KeepAlive>
      <template #fallback>
        <AppSkeletonList :rows="3" />
      </template>
    </ClientOnly>

    <div class="space-y-3 rounded-xl border border-default bg-default p-4">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search tasks…"
        size="xl"
        class="w-full lg:max-w-lg"
        aria-label="Search tasks"
      />
      <TaskFilters @change="onFiltersChange" />

      <div v-if="store.meta" class="text-sm text-muted">
        <b>{{ store.meta.total }}</b> tasks on the board
      </div>
    </div>

    <div v-if="pending && !data" class="grid gap-4 lg:grid-cols-[1fr_280px]">
      <AppSkeletonList :rows="6" />
      <USkeleton class="h-64 w-full rounded-xl" />
    </div>

    <div v-else-if="error" class="rounded-xl border border-error/30 bg-error/5 p-6" role="alert">
      <h2 class="font-semibold text-error">Could not load tasks</h2>
      <p class="mt-1 text-sm text-muted">
        {{ error.message }}
      </p>
      <UButton class="mt-4" icon="i-lucide-refresh-cw" @click="refreshAsyncData()"> Retry </UButton>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-auto">
      <section class="space-y-3">
        <TaskKanban :columns="columns" />

        <p
          v-if="isEmpty"
          class="rounded-xl border border-dashed border-default px-4 py-6 text-center text-sm text-muted"
        >
          Create a task to fill your Todo column, then drag it across the board.
        </p>
      </section>

      <TaskDetailPanel
        class="xl:block"
        :class="selected ? 'block' : 'hidden xl:block'"
        :task="selected"
        @close="onCloseDetail"
        @toggle-done="onToggleFromDetail"
        @remove="onRemoveFromDetail"
      />
    </div>

    <TaskBulkBar
      :count="store.selectedCount"
      :pending="bulkPending"
      @clear="store.clearSelection()"
      @complete="onBulkComplete"
      @delete="onBulkDelete"
      @move="onBulkMove"
    />
  </div>
</template>

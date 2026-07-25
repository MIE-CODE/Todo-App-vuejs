import { computed, effectScope, onScopeDispose, shallowRef, watch } from 'vue'
import type { CreateTaskInput, Task } from '#features/tasks/schemas/task'
import { createTaskSchema } from '#features/tasks/schemas/task'
import { useTaskStore } from '#features/tasks/stores/useTaskStore'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'
import { groupTasksByStatus } from '#features/tasks/utils/groupByStatus'
import { useAppToast } from '#shared/composables/useAppToast'
import { usePagination } from '#shared/composables/usePagination'
import { useSearch } from '#shared/composables/useSearch'
import { extractApiErrorMessage } from '#shared/utils/apiError'

const BOARD_PAGE_SIZE = 100

/**
 * Feature orchestration composable.
 * Pages/components should call this instead of talking to Pinia + fetch directly.
 */
export function useTasks() {
  const store = useTaskStore()
  const toast = useAppToast()
  const pagination = usePagination(BOARD_PAGE_SIZE)
  const { search, debouncedSearch, clear: clearSearch } = useSearch(350)

  /**
   * shallowRef: we only replace the whole list reference, never mutate nested fields here.
   * Nested task updates go through the store actions.
   */
  const boardSnapshot = shallowRef<Task[]>([])

  /**
   * effectScope groups temporary watchers so we can dispose them cleanly
   * when leaving a page that uses this composable for local experiments.
   */
  const scope = effectScope()

  scope.run(() => {
    watch(debouncedSearch, async (value) => {
      store.setSearch(value)
      pagination.reset()
      await refresh()
    })

    watch(
      () => store.items,
      (items) => {
        boardSnapshot.value = items
      },
      { immediate: true }
    )
  })

  const selected = computed(() => store.selectedTask)
  const isEmpty = computed(() => !store.pending && store.items.length === 0)
  const columns = computed(() => groupTasksByStatus(boardSnapshot.value))

  async function refresh(page = pagination.page.value) {
    await store.fetchTasks(page)
    pagination.setTotal(store.meta?.total ?? 0)
    pagination.page.value = store.meta?.page ?? page
  }

  async function create(input: CreateTaskInput) {
    const parsed = createTaskSchema.safeParse(input)

    if (!parsed.success) {
      toast.error('Validation failed', parsed.error.issues[0]?.message ?? 'Invalid task')
      return null
    }

    try {
      const created = await store.createTask(parsed.data)
      toast.success('Task created', created.title)
      await refresh()
      return created
    } catch (error) {
      toast.error('Could not create task', extractApiErrorMessage(error))
      return null
    }
  }

  async function toggleDone(task: Task) {
    try {
      await store.updateTask(task.id, {
        status: task.status === 'done' ? 'todo' : 'done',
        version: task.version
      })
    } catch (error) {
      toast.error('Update failed', extractApiErrorMessage(error))
    }
  }

  async function moveToStatus(task: Task, status: BoardStatus) {
    if (task.status === status) {
      return
    }

    try {
      await store.updateTask(task.id, { status, version: task.version })
    } catch (error) {
      toast.error('Could not move task', extractApiErrorMessage(error))
    }
  }

  async function rename(task: Task, title: string) {
    const next = title.trim()
    if (!next || next === task.title) {
      return
    }

    try {
      await store.updateTask(task.id, { title: next, version: task.version })
    } catch (error) {
      toast.error('Could not rename task', extractApiErrorMessage(error))
    }
  }

  async function remove(task: Task) {
    try {
      await store.deleteTask(task.id)
      toast.success('Task deleted', 'Press Undo to restore')
    } catch (error) {
      toast.error('Delete failed', extractApiErrorMessage(error))
    }
  }

  async function undo() {
    try {
      const restored = await store.undoDelete()
      if (restored) {
        toast.success('Task restored', restored.title)
        await refresh()
      }
    } catch (error) {
      toast.error('Restore failed', extractApiErrorMessage(error))
    }
  }

  async function bulkComplete() {
    const ids = [...store.selectedIds]
    if (!ids.length) {
      return
    }

    try {
      const result = await store.bulkAction({ action: 'complete', ids })
      toast.success('Tasks completed', `${result.updated.length} updated`)
      if (result.failed.length) {
        toast.error('Some tasks failed', `${result.failed.length} could not be updated`)
      }
    } catch (error) {
      toast.error('Bulk complete failed', extractApiErrorMessage(error))
    }
  }

  async function bulkDelete() {
    const ids = [...store.selectedIds]
    if (!ids.length) {
      return
    }

    try {
      const result = await store.bulkAction({ action: 'delete', ids })
      toast.success('Tasks deleted', `${result.updated.length} removed`)
      if (result.failed.length) {
        toast.error('Some tasks failed', `${result.failed.length} could not be deleted`)
      }
    } catch (error) {
      toast.error('Bulk delete failed', extractApiErrorMessage(error))
    }
  }

  async function bulkMove(status: BoardStatus) {
    const ids = [...store.selectedIds]
    if (!ids.length) {
      return
    }

    try {
      const result = await store.bulkAction({ action: 'move', ids, status })
      toast.success('Tasks moved', `${result.updated.length} updated`)
      if (result.failed.length) {
        toast.error('Some tasks failed', `${result.failed.length} could not be moved`)
      }
    } catch (error) {
      toast.error('Bulk move failed', extractApiErrorMessage(error))
    }
  }

  onScopeDispose(() => {
    scope.stop()
  })

  return {
    store,
    search,
    clearSearch,
    pagination,
    boardSnapshot,
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
  }
}

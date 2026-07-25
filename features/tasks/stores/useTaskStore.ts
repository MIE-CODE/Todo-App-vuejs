import { markRaw } from 'vue'
import { defineStore } from 'pinia'
import type {
  BulkTaskActionInput,
  BulkTaskResult,
  CreateTaskInput,
  Task,
  TaskListQuery,
  UpdateTaskInput
} from '#features/tasks/schemas/task'
import { clearTaskCache, readTaskCache, writeTaskCache } from '#features/tasks/utils/taskStorage'
import type { PaginatedResult } from '#shared/types/api'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

interface TaskFilters {
  status?: TaskListQuery['status']
  priority?: TaskListQuery['priority']
  tag?: string
  sortBy: TaskListQuery['sortBy']
  sortDir: TaskListQuery['sortDir']
}

interface TaskState {
  items: Task[]
  meta: PaginatedResult<Task>['meta'] | null
  selectedId: string | null
  /** Multi-select for bulk actions (independent of the detail-panel selection). */
  selectedIds: string[]
  filters: TaskFilters
  search: string
  pending: boolean
  errorMessage: string | null
  /**
   * markRaw prevents Vue from deeply proxying undo snapshots.
   * Large plain objects do not need deep reactivity.
   */
  lastDeleted: Task | null
}

const BOARD_PAGE_SIZE = 100

function currentUserId(): string | null {
  try {
    return useAuthStore().user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Pinia owns client-side task orchestration and optimistic UI state.
 * Server remains the source of truth; the board is also mirrored to
 * localStorage so refreshes stay snappy and survive ephemeral DB hosts.
 */
export const useTaskStore = defineStore('tasks', {
  state: (): TaskState => ({
    items: [],
    meta: null,
    selectedId: null,
    selectedIds: [],
    filters: {
      sortBy: 'createdAt',
      sortDir: 'desc'
    },
    search: '',
    pending: false,
    errorMessage: null,
    lastDeleted: null
  }),

  getters: {
    selectedTask(state): Task | null {
      return state.items.find(task => task.id === state.selectedId) ?? null
    },

    selectedCount(state): number {
      return state.selectedIds.length
    },

    openCount(state): number {
      return state.items.filter(task => task.status !== 'done' && task.status !== 'archived').length
    },

    query(state): TaskListQuery {
      return {
        page: state.meta?.page ?? 1,
        pageSize: state.meta?.pageSize ?? BOARD_PAGE_SIZE,
        search: state.search || undefined,
        status: state.filters.status,
        priority: state.filters.priority,
        tag: state.filters.tag,
        sortBy: state.filters.sortBy,
        sortDir: state.filters.sortDir
      }
    }
  },

  actions: {
    /** Hydrate the board from localStorage before/without a network round-trip. */
    hydrateFromStorage() {
      const userId = currentUserId()
      if (!userId) {
        return false
      }
      const cached = readTaskCache(userId)
      if (!cached) {
        return false
      }
      this.items = cached.items
      this.filters = { ...this.filters, ...cached.filters }
      this.search = cached.search
      this.meta = {
        page: 1,
        pageSize: BOARD_PAGE_SIZE,
        total: cached.items.length,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false
      }
      return true
    },

    persistToStorage() {
      const userId = currentUserId()
      if (!userId) {
        return
      }
      writeTaskCache(userId, {
        items: this.items,
        filters: this.filters,
        search: this.search
      })
    },

    clearStorage() {
      const userId = currentUserId()
      if (userId) {
        clearTaskCache(userId)
      }
      this.items = []
      this.meta = null
      this.selectedId = null
      this.selectedIds = []
      this.lastDeleted = null
    },

    async fetchTasks(page = 1) {
      // Paint from web storage immediately, then reconcile with the API.
      if (!this.items.length) {
        this.hydrateFromStorage()
      }

      this.pending = true
      this.errorMessage = null

      try {
        const { $api } = useNuxtApp()
        const result = await $api<PaginatedResult<Task>>('/api/tasks', {
          query: {
            ...this.query,
            page,
            pageSize: BOARD_PAGE_SIZE
          }
        })

        this.items = result.data
        this.meta = result.meta
        this.selectedIds = this.selectedIds.filter(id =>
          result.data.some(task => task.id === id)
        )
        this.persistToStorage()
      } catch (error) {
        this.errorMessage = extractErrorMessage(error)
        // Keep the cached board visible if the network/DB is down.
        if (!this.items.length) {
          throw error
        }
      } finally {
        this.pending = false
      }
    },

    async createTask(input: CreateTaskInput) {
      const { $api } = useNuxtApp()
      const created = await $api<Task>('/api/tasks', {
        method: 'POST',
        body: input
      })

      this.items = [created, ...this.items]
      this.persistToStorage()
      return created
    },

    async updateTask(taskId: string, input: Omit<UpdateTaskInput, 'version'> & { version?: number }) {
      const current = this.items.find(task => task.id === taskId)

      if (!current) {
        throw new Error('Task not found in local cache')
      }

      const payload: UpdateTaskInput = {
        ...input,
        version: input.version ?? current.version
      }

      const previous = { ...current }

      this.items = this.items.map(task =>
        task.id === taskId
          ? {
              ...task,
              ...input,
              version: task.version + 1,
              updatedAt: new Date().toISOString(),
              completedAt:
                input.status === 'done'
                  ? task.completedAt ?? new Date().toISOString()
                  : input.status
                    ? null
                    : task.completedAt
            }
          : task
      )
      this.persistToStorage()

      try {
        const { $api } = useNuxtApp()
        const updated = await $api<Task>(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: payload
        })

        this.items = this.items.map(task => (task.id === taskId ? updated : task))
        this.persistToStorage()
        return updated
      } catch (error) {
        this.items = this.items.map(task => (task.id === taskId ? previous : task))
        this.persistToStorage()
        throw error
      }
    },

    async deleteTask(taskId: string) {
      const current = this.items.find(task => task.id === taskId)

      if (!current) {
        return
      }

      this.lastDeleted = markRaw({ ...current })
      this.items = this.items.filter(task => task.id !== taskId)
      this.selectedIds = this.selectedIds.filter(id => id !== taskId)
      if (this.selectedId === taskId) {
        this.selectedId = null
      }
      this.persistToStorage()

      try {
        const { $api } = useNuxtApp()
        await $api(`/api/tasks/${taskId}`, { method: 'DELETE' })
      } catch (error) {
        this.items = [current, ...this.items]
        this.lastDeleted = null
        this.persistToStorage()
        throw error
      }
    },

    async undoDelete() {
      if (!this.lastDeleted) {
        return null
      }

      const snapshot = this.lastDeleted
      this.lastDeleted = null

      return this.createTask({
        title: snapshot.title,
        description: snapshot.description,
        status: snapshot.status === 'archived' ? 'todo' : snapshot.status,
        priority: snapshot.priority,
        dueDate: snapshot.dueDate,
        dueTime: snapshot.dueTime,
        tags: snapshot.tags
      })
    },

    async bulkAction(input: BulkTaskActionInput): Promise<BulkTaskResult> {
      const { $api } = useNuxtApp()
      const snapshot = this.items.filter(task => input.ids.includes(task.id))

      if (input.action === 'delete') {
        this.items = this.items.filter(task => !input.ids.includes(task.id))
      } else {
        const nextStatus = input.action === 'complete' ? 'done' : input.status
        this.items = this.items.map((task) => {
          if (!input.ids.includes(task.id) || !nextStatus) {
            return task
          }
          return {
            ...task,
            status: nextStatus,
            version: task.version + 1,
            updatedAt: new Date().toISOString(),
            completedAt:
              nextStatus === 'done'
                ? task.completedAt ?? new Date().toISOString()
                : null
          }
        })
      }
      this.persistToStorage()

      try {
        const result = await $api<BulkTaskResult>('/api/tasks/bulk', {
          method: 'POST',
          body: input
        })

        if (result.failed.length > 0) {
          const failedIds = new Set(result.failed.map(entry => entry.id))
          for (const previous of snapshot) {
            if (!failedIds.has(previous.id)) {
              continue
            }
            this.items = [
              previous,
              ...this.items.filter(task => task.id !== previous.id)
            ]
          }
        }

        this.selectedIds = this.selectedIds.filter(id => !result.updated.includes(id))
        if (this.selectedId && result.updated.includes(this.selectedId)) {
          this.selectedId = null
        }

        this.persistToStorage()
        return result
      } catch (error) {
        for (const previous of snapshot) {
          if (!this.items.some(task => task.id === previous.id)) {
            this.items = [previous, ...this.items]
          } else {
            this.items = this.items.map(task =>
              task.id === previous.id ? previous : task
            )
          }
        }
        this.persistToStorage()
        throw error
      }
    },

    selectTask(taskId: string | null) {
      this.selectedId = taskId
    },

    toggleSelectedId(taskId: string) {
      if (this.selectedIds.includes(taskId)) {
        this.selectedIds = this.selectedIds.filter(id => id !== taskId)
      } else {
        this.selectedIds = [...this.selectedIds, taskId]
      }
    },

    setSelectedIds(ids: string[]) {
      this.selectedIds = [...new Set(ids)]
    },

    clearSelection() {
      this.selectedIds = []
    },

    selectAllIn(ids: string[]) {
      this.selectedIds = [...new Set([...this.selectedIds, ...ids])]
    },

    deselectIds(ids: string[]) {
      const remove = new Set(ids)
      this.selectedIds = this.selectedIds.filter(id => !remove.has(id))
    },

    setSearch(value: string) {
      this.search = value
      this.persistToStorage()
    },

    setFilters(filters: Partial<TaskFilters>) {
      this.filters = {
        ...this.filters,
        ...filters
      }
      this.persistToStorage()
    }
  }
})

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'data' in error) {
    const data = (error as { data?: { message?: string } }).data
    if (data?.message) {
      return data.message
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong'
}

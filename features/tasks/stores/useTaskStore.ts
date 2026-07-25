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
import type { PaginatedResult } from '#shared/types/api'

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

/**
 * Pinia owns client-side task orchestration and optimistic UI state.
 * Server remains the source of truth; this store is a cache + UX layer.
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
      return state.items.find((task) => task.id === state.selectedId) ?? null
    },

    selectedCount(state): number {
      return state.selectedIds.length
    },

    openCount(state): number {
      return state.items.filter((task) => task.status !== 'done' && task.status !== 'archived')
        .length
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
    async fetchTasks(page = 1) {
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
        // Drop selections that no longer exist after a refetch.
        this.selectedIds = this.selectedIds.filter((id) =>
          result.data.some((task) => task.id === id)
        )
      } catch (error) {
        this.errorMessage = extractErrorMessage(error)
        throw error
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
      return created
    },

    async updateTask(taskId: string, input: Omit<UpdateTaskInput, 'version'> & { version?: number }) {
      const current = this.items.find((task) => task.id === taskId)

      if (!current) {
        throw new Error('Task not found in local cache')
      }

      const payload: UpdateTaskInput = {
        ...input,
        version: input.version ?? current.version
      }

      const previous = { ...current }

      // Optimistic update for snappy UX; roll back on failure.
      this.items = this.items.map((task) =>
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

      try {
        const { $api } = useNuxtApp()
        const updated = await $api<Task>(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          body: payload
        })

        this.items = this.items.map((task) => (task.id === taskId ? updated : task))
        return updated
      } catch (error) {
        this.items = this.items.map((task) => (task.id === taskId ? previous : task))
        throw error
      }
    },

    async deleteTask(taskId: string) {
      const current = this.items.find((task) => task.id === taskId)

      if (!current) {
        return
      }

      this.lastDeleted = markRaw({ ...current })
      this.items = this.items.filter((task) => task.id !== taskId)
      this.selectedIds = this.selectedIds.filter((id) => id !== taskId)
      if (this.selectedId === taskId) {
        this.selectedId = null
      }

      try {
        const { $api } = useNuxtApp()
        await $api(`/api/tasks/${taskId}`, { method: 'DELETE' })
      } catch (error) {
        this.items = [current, ...this.items]
        this.lastDeleted = null
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
        tags: snapshot.tags
      })
    },

    async bulkAction(input: BulkTaskActionInput): Promise<BulkTaskResult> {
      const { $api } = useNuxtApp()
      const snapshot = this.items.filter((task) => input.ids.includes(task.id))

      // Optimistic local apply for snappy bulk UX.
      if (input.action === 'delete') {
        this.items = this.items.filter((task) => !input.ids.includes(task.id))
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

      try {
        const result = await $api<BulkTaskResult>('/api/tasks/bulk', {
          method: 'POST',
          body: input
        })

        // Roll back any ids the server rejected.
        if (result.failed.length > 0) {
          const failedIds = new Set(result.failed.map((entry) => entry.id))
          for (const previous of snapshot) {
            if (!failedIds.has(previous.id)) {
              continue
            }
            this.items = [
              previous,
              ...this.items.filter((task) => task.id !== previous.id)
            ]
          }
        }

        this.selectedIds = this.selectedIds.filter((id) => !result.updated.includes(id))
        if (this.selectedId && result.updated.includes(this.selectedId)) {
          this.selectedId = null
        }

        return result
      } catch (error) {
        // Full rollback on transport/auth failure.
        for (const previous of snapshot) {
          if (!this.items.some((task) => task.id === previous.id)) {
            this.items = [previous, ...this.items]
          } else {
            this.items = this.items.map((task) =>
              task.id === previous.id ? previous : task
            )
          }
        }
        throw error
      }
    },

    selectTask(taskId: string | null) {
      this.selectedId = taskId
    },

    toggleSelectedId(taskId: string) {
      if (this.selectedIds.includes(taskId)) {
        this.selectedIds = this.selectedIds.filter((id) => id !== taskId)
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
      this.selectedIds = this.selectedIds.filter((id) => !remove.has(id))
    },

    setSearch(value: string) {
      this.search = value
    },

    setFilters(filters: Partial<TaskFilters>) {
      this.filters = {
        ...this.filters,
        ...filters
      }
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

import { inject, provide, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import type { Task } from '#features/tasks/schemas/task'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'

/**
 * Provide/inject contract for compound Task components.
 * Avoids prop drilling through TaskBoard → columns → TaskItem.
 */
export interface TaskBoardContext {
  selectedId: Ref<string | null> | ComputedRef<string | null>
  selectedIds: Ref<string[]> | ComputedRef<string[]>
  select: (taskId: string | null) => void
  toggleMultiSelect: (taskId: string) => void
  isMultiSelected: (taskId: string) => boolean
  toggleDone: (task: Task) => Promise<void>
  remove: (task: Task) => Promise<void>
  moveToStatus: (task: Task, status: BoardStatus) => Promise<void>
  /** Resolves a task by id (needed when dropping onto another column). */
  moveTaskById: (taskId: string, status: BoardStatus) => Promise<void>
  rename: (task: Task, title: string) => Promise<void>
  selectAllInColumn: (taskIds: string[]) => void
  /** Removes only the given ids from the multi-select set. */
  deselectInColumn: (taskIds: string[]) => void
}

export const taskBoardKey: InjectionKey<TaskBoardContext> = Symbol('task-board')

export function provideTaskBoard(context: TaskBoardContext) {
  provide(taskBoardKey, context)
}

export function useTaskBoard() {
  const context = inject(taskBoardKey)

  if (!context) {
    throw new Error('useTaskBoard() must be used within a TaskBoard provider')
  }

  return context
}

import type { Task } from '#features/tasks/schemas/task'
import type { TaskStatus } from '#shared/constants/app'

/** Board columns — archived is filterable but never a drop target. */
export const BOARD_STATUSES = ['todo', 'in_progress', 'done'] as const
export type BoardStatus = (typeof BOARD_STATUSES)[number]

export const BOARD_STATUS_LABELS: Record<BoardStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done'
}

export type TasksByStatus = Record<BoardStatus, Task[]>

/**
 * Groups tasks into the three kanban columns.
 * Archived tasks are omitted from the board (they still appear in filtered list APIs).
 */
export function groupTasksByStatus(tasks: readonly Task[]): TasksByStatus {
  const groups: TasksByStatus = {
    todo: [],
    in_progress: [],
    done: []
  }

  for (const task of tasks) {
    if (task.status === 'todo' || task.status === 'in_progress' || task.status === 'done') {
      groups[task.status].push(task)
    }
  }

  return groups
}

export function isBoardStatus(value: string): value is BoardStatus {
  return (BOARD_STATUSES as readonly string[]).includes(value)
}

export function isTaskStatus(value: string): value is TaskStatus {
  return value === 'todo' || value === 'in_progress' || value === 'done' || value === 'archived'
}

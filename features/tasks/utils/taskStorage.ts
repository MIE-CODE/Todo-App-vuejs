import type { Task } from '#features/tasks/schemas/task'
import type { TaskListQuery } from '#features/tasks/schemas/task'
import { taskStorageKey } from '#shared/constants/app'

export interface TaskBoardCache {
  items: Task[]
  filters: {
    status?: TaskListQuery['status']
    priority?: TaskListQuery['priority']
    tag?: string
    sortBy: TaskListQuery['sortBy']
    sortDir: TaskListQuery['sortDir']
  }
  search: string
  updatedAt: string
}

/**
 * Web Storage helpers for the task board cache.
 * Server remains authoritative; this makes refreshes/offline-ish UX snappy and
 * cushions ephemeral serverless SQLite resets on hosts like Vercel.
 */
export function readTaskCache(userId: string): TaskBoardCache | null {
  if (!import.meta.client) {
    return null
  }

  try {
    const raw = localStorage.getItem(taskStorageKey(userId))
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as TaskBoardCache
    if (!parsed || !Array.isArray(parsed.items)) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeTaskCache(userId: string, cache: Omit<TaskBoardCache, 'updatedAt'>): void {
  if (!import.meta.client) {
    return
  }

  try {
    const payload: TaskBoardCache = {
      ...cache,
      updatedAt: new Date().toISOString()
    }
    localStorage.setItem(taskStorageKey(userId), JSON.stringify(payload))
  } catch {
    // Quota / private mode — ignore; the live API still works.
  }
}

export function clearTaskCache(userId: string): void {
  if (!import.meta.client) {
    return
  }

  try {
    localStorage.removeItem(taskStorageKey(userId))
  } catch {
    // ignore
  }
}

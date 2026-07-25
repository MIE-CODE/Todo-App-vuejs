import type { Task } from '#features/tasks/schemas/task'
import type { TaskPriority, TaskStatus } from '#shared/constants/app'

/**
 * Mapper helpers convert between persistence rows and domain/API models.
 * Keeping mapping in one place prevents leaking DB column names into UI code.
 */

export interface TaskRow {
  id: string
  user_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  tags_json: string
  version: number
  created_at: string
  updated_at: string
  completed_at: string | null
}

export function mapTaskRowToTask(row: TaskRow): Task {
  const parsedTags: unknown = JSON.parse(row.tags_json)

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    dueDate: row.due_date,
    tags: Array.isArray(parsedTags)
      ? parsedTags.filter((tag): tag is string => typeof tag === 'string')
      : [],
    version: row.version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at
  }
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags)
}

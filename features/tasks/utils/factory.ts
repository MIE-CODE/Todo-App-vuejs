import { nanoid } from 'nanoid'
import type { CreateTaskInput, Task } from '#features/tasks/schemas/task'
import { nowIso } from '#shared/utils/date'

/**
 * Factories build valid domain objects for seeds and tests.
 * Prefer factories over hand-written fixtures that drift from schemas.
 */
export function createTaskFactory(
  userId: string,
  input: CreateTaskInput,
  overrides: Partial<Task> = {}
): Task {
  const timestamp = nowIso()

  return {
    id: nanoid(),
    userId,
    title: input.title,
    description: input.description ?? null,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate ?? null,
    dueTime: input.dueTime ?? null,
    tags: input.tags,
    version: 1,
    createdAt: timestamp,
    updatedAt: timestamp,
    completedAt: input.status === 'done' ? timestamp : null,
    ...overrides
  }
}

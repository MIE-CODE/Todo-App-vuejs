import type {
  BulkTaskActionInput,
  BulkTaskResult,
  CreateTaskInput,
  TaskListQuery,
  UpdateTaskInput
} from '#features/tasks/schemas/task'
import { createTaskRepository } from '../repositories/taskRepository'

/**
 * Services encode business rules.
 * Handlers stay thin: parse → authorize → call service → return.
 */
export function createTaskService() {
  const repository = createTaskRepository()

  return {
    list(userId: string, query: TaskListQuery) {
      return repository.list(userId, query)
    },

    get(userId: string, taskId: string) {
      return repository.findById(userId, taskId)
    },

    create(userId: string, input: CreateTaskInput) {
      const normalizedTags = normalizeTags(input.tags)

      return repository.create(userId, {
        ...input,
        tags: normalizedTags
      })
    },

    update(userId: string, taskId: string, input: UpdateTaskInput) {
      return repository.update(userId, taskId, {
        ...input,
        tags: input.tags ? normalizeTags(input.tags) : undefined
      })
    },

    remove(userId: string, taskId: string) {
      return repository.remove(userId, taskId)
    },

    stats(userId: string) {
      return repository.stats(userId)
    },

    /**
     * Bulk ops are ownership-scoped and best-effort per id.
     * Partial success is returned so the client can reconcile selection.
     */
    async bulk(userId: string, input: BulkTaskActionInput): Promise<BulkTaskResult> {
      const updated: string[] = []
      const failed: BulkTaskResult['failed'] = []

      for (const id of input.ids) {
        try {
          if (input.action === 'delete') {
            await repository.remove(userId, id)
            updated.push(id)
            continue
          }

          const existing = await repository.findById(userId, id)
          if (!existing) {
            failed.push({ id, message: 'Task not found' })
            continue
          }

          const nextStatus
            = input.action === 'complete' ? 'done' : (input.status ?? existing.status)

          await repository.update(userId, id, {
            status: nextStatus,
            version: existing.version
          })
          updated.push(id)
        } catch (error) {
          failed.push({
            id,
            message: error instanceof Error ? error.message : 'Update failed'
          })
        }
      }

      return { updated, failed }
    }
  }
}

function normalizeTags(tags: string[]): string[] {
  const unique = new Set(tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))
  return [...unique]
}

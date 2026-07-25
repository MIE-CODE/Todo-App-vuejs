import { z } from 'zod'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import { paginationQuerySchema } from '#shared/schemas/pagination'

export const taskStatusSchema = z.enum(TASK_STATUSES)
export const taskPrioritySchema = z.enum(TASK_PRIORITIES)

/** Local wall-clock `HH:mm` (24h). Time-of-day only; the date lives in `dueDate`. */
export const dueTimeSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Time must be in HH:mm format')

export const taskSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).nullable(),
  status: taskStatusSchema,
  priority: taskPrioritySchema,
  dueDate: z.string().datetime().nullable(),
  dueTime: dueTimeSchema.nullable(),
  tags: z.array(z.string().min(1).max(40)).max(20),
  version: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable()
})

export type Task = z.infer<typeof taskSchema>

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(5000).optional().nullable(),
  status: taskStatusSchema.default('todo'),
  priority: taskPrioritySchema.default('medium'),
  dueDate: z.string().datetime().optional().nullable(),
  dueTime: dueTimeSchema.optional().nullable(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([])
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(5000).nullable().optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: z.string().datetime().nullable().optional(),
    dueTime: dueTimeSchema.nullable().optional(),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
    /**
     * Optimistic concurrency token.
     * Clients send the version they last read; stale writes get 409 CONFLICT.
     */
    version: z.number().int().positive()
  })
  .refine(
    (value) =>
      value.title !== undefined
      || value.description !== undefined
      || value.status !== undefined
      || value.priority !== undefined
      || value.dueDate !== undefined
      || value.dueTime !== undefined
      || value.tags !== undefined,
    { message: 'At least one field must be updated' }
  )

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>

export const taskListQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(100).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  tag: z.string().trim().max(40).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority', 'title']).default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc')
})

export type TaskListQuery = z.infer<typeof taskListQuerySchema>

export const bulkTaskActionSchema = z
  .object({
    action: z.enum(['complete', 'delete', 'move']),
    ids: z.array(z.string().min(1)).min(1).max(100),
    /** Required when action is `move`. */
    status: taskStatusSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.action === 'move' && !value.status) {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Status is required when moving tasks'
      })
    }
    if (value.action === 'move' && value.status === 'archived') {
      ctx.addIssue({
        code: 'custom',
        path: ['status'],
        message: 'Use delete or a board status; archived is not a move target'
      })
    }
  })

export type BulkTaskActionInput = z.infer<typeof bulkTaskActionSchema>

export interface BulkTaskResult {
  updated: string[]
  failed: Array<{ id: string; message: string }>
}

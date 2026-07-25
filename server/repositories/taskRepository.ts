import { and, asc, count, desc, eq, gte, isNotNull, like, lt, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { CreateTaskInput, Task, TaskListQuery, UpdateTaskInput } from '#features/tasks/schemas/task'
import { buildPaginationMeta } from '#shared/schemas/pagination'
import type { PaginatedResult } from '#shared/types/api'
import { nowIso } from '#shared/utils/date'
import { useDatabase } from '../database/client'
import { tasks } from '../database/schema'
import { conflictError, notFoundError } from '../utils/errors'

/**
 * Repository owns SQL. Services never talk to drizzle directly.
 * That seam makes swapping storage (or writing in-memory test doubles) cheap.
 */
export function createTaskRepository() {
  const { db } = useDatabase()

  return {
    async list(userId: string, query: TaskListQuery): Promise<PaginatedResult<Task>> {
      const filters = [eq(tasks.userId, userId)]

      if (query.status) {
        filters.push(eq(tasks.status, query.status))
      }

      if (query.priority) {
        filters.push(eq(tasks.priority, query.priority))
      }

      if (query.search) {
        filters.push(like(tasks.title, `%${query.search}%`))
      }

      if (query.tag) {
        filters.push(like(tasks.tagsJson, `%"${query.tag}"%`))
      }

      const whereClause = and(...filters)
      const sortColumn = {
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        dueDate: tasks.dueDate,
        priority: tasks.priority,
        title: tasks.title
      }[query.sortBy]

      const orderBy = query.sortDir === 'asc' ? asc(sortColumn) : desc(sortColumn)
      const offset = (query.page - 1) * query.pageSize

      const [totalRow] = await db.select({ value: count() }).from(tasks).where(whereClause)
      const rows = await db
        .select()
        .from(tasks)
        .where(whereClause)
        .orderBy(orderBy)
        .limit(query.pageSize)
        .offset(offset)

      return {
        data: rows.map(mapRecordToTask),
        meta: buildPaginationMeta(query.page, query.pageSize, totalRow?.value ?? 0)
      }
    },

    async findById(userId: string, taskId: string): Promise<Task | null> {
      const [row] = await db
        .select()
        .from(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .limit(1)

      return row ? mapRecordToTask(row) : null
    },

    async create(userId: string, input: CreateTaskInput): Promise<Task> {
      const timestamp = nowIso()
      const id = nanoid()

      await db.insert(tasks).values({
        id,
        userId,
        title: input.title,
        description: input.description ?? null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ?? null,
        tagsJson: JSON.stringify(input.tags),
        version: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: input.status === 'done' ? timestamp : null
      })

      const created = await this.findById(userId, id)

      if (!created) {
        throw notFoundError('Failed to load created task')
      }

      return created
    },

    async update(userId: string, taskId: string, input: UpdateTaskInput): Promise<Task> {
      const existing = await this.findById(userId, taskId)

      if (!existing) {
        throw notFoundError('Task not found')
      }

      if (existing.version !== input.version) {
        throw conflictError(
          'This task changed since you last loaded it. Refresh and try again.'
        )
      }

      const timestamp = nowIso()
      const nextStatus = input.status ?? existing.status
      const completedAt
        = nextStatus === 'done'
          ? existing.completedAt ?? timestamp
          : null

      const result = await db
        .update(tasks)
        .set({
          title: input.title ?? existing.title,
          description:
            input.description !== undefined ? input.description : existing.description,
          status: nextStatus,
          priority: input.priority ?? existing.priority,
          dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
          tagsJson:
            input.tags !== undefined ? JSON.stringify(input.tags) : JSON.stringify(existing.tags),
          version: existing.version + 1,
          updatedAt: timestamp,
          completedAt
        })
        .where(
          and(
            eq(tasks.id, taskId),
            eq(tasks.userId, userId),
            eq(tasks.version, input.version)
          )
        )
        .returning({ id: tasks.id })

      if (result.length === 0) {
        throw conflictError(
          'This task changed since you last loaded it. Refresh and try again.'
        )
      }

      const updated = await this.findById(userId, taskId)

      if (!updated) {
        throw notFoundError('Task not found after update')
      }

      return updated
    },

    async remove(userId: string, taskId: string): Promise<void> {
      const result = await db
        .delete(tasks)
        .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
        .returning({ id: tasks.id })

      if (result.length === 0) {
        throw notFoundError('Task not found')
      }
    },

    async stats(userId: string) {
      const rows = await db
        .select({
          status: tasks.status,
          total: count()
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.status)

      return rows
    },

    /** Loads every task for a user. Fine at single-user todo scale; drives analytics. */
    async allForUser(userId: string): Promise<Task[]> {
      const rows = await db
        .select()
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .orderBy(desc(tasks.createdAt))

      return rows.map(mapRecordToTask)
    },

    /** Tasks with a due date inside [startIso, endIso). Drives the calendar. */
    async byDueDateRange(userId: string, startIso: string, endIso: string): Promise<Task[]> {
      const rows = await db
        .select()
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            isNotNull(tasks.dueDate),
            gte(tasks.dueDate, startIso),
            lt(tasks.dueDate, endIso)
          )
        )
        .orderBy(asc(tasks.dueDate))

      return rows.map(mapRecordToTask)
    }
  }
}

function mapRecordToTask(row: typeof tasks.$inferSelect): Task {
  const parsed: unknown = JSON.parse(row.tagsJson)

  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    description: row.description,
    status: row.status as Task['status'],
    priority: row.priority as Task['priority'],
    dueDate: row.dueDate,
    tags: Array.isArray(parsed)
      ? parsed.filter((tag): tag is string => typeof tag === 'string')
      : [],
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    completedAt: row.completedAt
  }
}

// Keep sql import available for future raw analytics queries without unused lint noise
void sql

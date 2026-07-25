import type { DashboardSummary, TaskAnalytics } from '#features/analytics/types'
import type { Task } from '#features/tasks/schemas/task'
import { computeAnalytics, isOverdue } from '#features/analytics/utils/aggregate'
import { createTaskRepository } from '../repositories/taskRepository'

/**
 * Derives dashboard/analytics views from the user's tasks on the server, so the
 * numbers are authoritative and identical across pages. No client-only truth.
 */
export function createAnalyticsService() {
  const repository = createTaskRepository()

  return {
    async analytics(userId: string): Promise<TaskAnalytics> {
      const tasks = await repository.allForUser(userId)
      return computeAnalytics(tasks)
    },

    async dashboard(userId: string): Promise<{
      summary: DashboardSummary
      upcoming: Task[]
      overdue: Task[]
    }> {
      const now = new Date()
      const tasks = await repository.allForUser(userId)
      const analytics = computeAnalytics(tasks, now)

      const active = tasks.filter(
        (task) => task.status !== 'done' && task.status !== 'archived'
      )

      const upcoming = active
        .filter((task) => task.dueDate && new Date(task.dueDate).getTime() >= now.getTime())
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
        .slice(0, 5)

      const overdue = active
        .filter((task) => isOverdue(task, now))
        .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
        .slice(0, 5)

      return {
        summary: {
          total: analytics.total,
          active: analytics.active,
          completed: analytics.completed,
          overdue: analytics.overdue,
          dueToday: analytics.dueToday,
          completionRate: analytics.completionRate
        },
        upcoming,
        overdue
      }
    },

    async calendarMonth(userId: string, year: number, month: number): Promise<Task[]> {
      // month is 1-12; build a UTC range covering the whole month.
      const start = new Date(Date.UTC(year, month - 1, 1)).toISOString()
      const end = new Date(Date.UTC(year, month, 1)).toISOString()
      return repository.byDueDateRange(userId, start, end)
    }
  }
}

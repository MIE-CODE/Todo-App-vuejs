import type { Task } from '#features/tasks/schemas/task'
import type { CompletionPoint, TagCount, TaskAnalytics } from '#features/analytics/types'
import { TASK_PRIORITIES, TASK_STATUSES } from '#shared/constants/app'
import type { TaskPriority, TaskStatus } from '#shared/constants/app'

/**
 * Pure analytics aggregation.
 *
 * Kept framework-free and side-effect-free so it can run on the server (source
 * of truth) and be unit-tested in isolation. The client renders these numbers;
 * it never recomputes business truth from partial data.
 */

function startOfDay(date: Date): Date {
  // UTC-based day boundaries keep aggregation deterministic regardless of the
  // server's local timezone, and consistent with our ISO (UTC) date keys.
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function isActive(task: Task): boolean {
  return task.status !== 'done' && task.status !== 'archived'
}

export function isOverdue(task: Task, now: Date): boolean {
  if (!task.dueDate || !isActive(task)) {
    return false
  }
  return new Date(task.dueDate).getTime() < now.getTime()
}

export function computeAnalytics(tasks: Task[], now: Date = new Date()): TaskAnalytics {
  const todayStart = startOfDay(now)
  const todayEnd = new Date(todayStart)
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1)
  const weekEnd = new Date(todayStart)
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7)

  const statusCounts = Object.fromEntries(
    TASK_STATUSES.map((status) => [status, 0])
  ) as Record<TaskStatus, number>
  const priorityCounts = Object.fromEntries(
    TASK_PRIORITIES.map((priority) => [priority, 0])
  ) as Record<TaskPriority, number>

  let completed = 0
  let overdue = 0
  let dueToday = 0
  let dueThisWeek = 0

  const tagTally = new Map<string, number>()
  const completionTally = new Map<string, number>()

  // Seed the last 7 day buckets so the chart is stable even with no data.
  const last7: CompletionPoint[] = []
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(todayStart)
    day.setUTCDate(day.getUTCDate() - offset)
    const key = day.toISOString().slice(0, 10)
    completionTally.set(key, 0)
    last7.push({ date: key, count: 0 })
  }

  for (const task of tasks) {
    statusCounts[task.status] += 1
    priorityCounts[task.priority] += 1

    if (task.status === 'done') {
      completed += 1
    }

    if (isOverdue(task, now)) {
      overdue += 1
    }

    if (task.dueDate && isActive(task)) {
      const due = new Date(task.dueDate).getTime()
      if (due >= todayStart.getTime() && due < todayEnd.getTime()) {
        dueToday += 1
      }
      if (due >= todayStart.getTime() && due < weekEnd.getTime()) {
        dueThisWeek += 1
      }
    }

    for (const tag of task.tags) {
      tagTally.set(tag, (tagTally.get(tag) ?? 0) + 1)
    }

    if (task.completedAt) {
      const key = new Date(task.completedAt).toISOString().slice(0, 10)
      if (completionTally.has(key)) {
        completionTally.set(key, (completionTally.get(key) ?? 0) + 1)
      }
    }
  }

  const completedLast7Days = last7.map((point) => ({
    date: point.date,
    count: completionTally.get(point.date) ?? 0
  }))

  const topTags: TagCount[] = [...tagTally.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const total = tasks.length
  const active = total - statusCounts.done - statusCounts.archived

  return {
    total,
    completed,
    active,
    completionRate: total === 0 ? 0 : Math.round((completed / total) * 100),
    overdue,
    dueToday,
    dueThisWeek,
    statusCounts,
    priorityCounts,
    completedLast7Days,
    topTags
  }
}

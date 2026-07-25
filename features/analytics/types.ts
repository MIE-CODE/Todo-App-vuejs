import type { TaskPriority, TaskStatus } from '#shared/constants/app'

export interface CompletionPoint {
  date: string
  count: number
}

export interface TagCount {
  tag: string
  count: number
}

export interface TaskAnalytics {
  total: number
  completed: number
  active: number
  completionRate: number
  overdue: number
  dueToday: number
  dueThisWeek: number
  statusCounts: Record<TaskStatus, number>
  priorityCounts: Record<TaskPriority, number>
  completedLast7Days: CompletionPoint[]
  topTags: TagCount[]
}

export interface DashboardSummary {
  total: number
  active: number
  completed: number
  overdue: number
  dueToday: number
  completionRate: number
}

import { describe, expect, it } from 'vitest'
import { computeAnalytics, isOverdue } from '#features/analytics/utils/aggregate'
import { createTaskFactory } from '#features/tasks/utils/factory'
import type { Task } from '#features/tasks/schemas/task'

const NOW = new Date('2026-07-15T12:00:00.000Z')

function iso(offsetDays: number): string {
  const date = new Date(NOW)
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString()
}

function build(): Task[] {
  return [
    createTaskFactory('u1', {
      title: 'Overdue todo',
      status: 'todo',
      priority: 'high',
      dueDate: iso(-2),
      tags: ['work'],
      description: null
    }),
    createTaskFactory('u1', {
      title: 'Due today',
      status: 'in_progress',
      priority: 'urgent',
      dueDate: iso(0),
      tags: ['work', 'focus'],
      description: null
    }),
    createTaskFactory('u1', {
      title: 'Later this week',
      status: 'todo',
      priority: 'low',
      dueDate: iso(3),
      tags: ['home'],
      description: null
    }),
    createTaskFactory(
      'u1',
      {
        title: 'Completed recently',
        status: 'done',
        priority: 'medium',
        dueDate: iso(-1),
        tags: ['health'],
        description: null
      },
      { completedAt: iso(-1) }
    )
  ]
}

describe('computeAnalytics', () => {
  it('counts totals, completion rate, and overdue correctly', () => {
    const analytics = computeAnalytics(build(), NOW)

    expect(analytics.total).toBe(4)
    expect(analytics.completed).toBe(1)
    expect(analytics.active).toBe(3)
    expect(analytics.completionRate).toBe(25)
    expect(analytics.overdue).toBe(1)
    expect(analytics.dueToday).toBe(1)
    // "This week" spans today → +7 days and excludes the already-overdue task.
    expect(analytics.dueThisWeek).toBe(2)
  })

  it('breaks down by status and priority', () => {
    const analytics = computeAnalytics(build(), NOW)
    expect(analytics.statusCounts.todo).toBe(2)
    expect(analytics.statusCounts.done).toBe(1)
    expect(analytics.priorityCounts.urgent).toBe(1)
  })

  it('builds a 7-day completion series ending today', () => {
    const analytics = computeAnalytics(build(), NOW)
    expect(analytics.completedLast7Days).toHaveLength(7)
    const last = analytics.completedLast7Days.at(-1)
    expect(last?.date).toBe('2026-07-15')
    const yesterday = analytics.completedLast7Days.find((p) => p.date === '2026-07-14')
    expect(yesterday?.count).toBe(1)
  })

  it('ranks top tags by frequency', () => {
    const analytics = computeAnalytics(build(), NOW)
    expect(analytics.topTags[0]?.tag).toBe('work')
    expect(analytics.topTags[0]?.count).toBe(2)
  })

  it('treats completed/archived tasks as never overdue', () => {
    const done = createTaskFactory(
      'u1',
      {
        title: 'done past due',
        status: 'done',
        priority: 'low',
        dueDate: iso(-5),
        tags: [],
        description: null
      },
      { completedAt: iso(-5) }
    )
    expect(isOverdue(done, NOW)).toBe(false)
  })
})

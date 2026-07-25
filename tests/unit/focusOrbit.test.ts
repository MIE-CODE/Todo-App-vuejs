import { describe, expect, it } from 'vitest'
import type { Task } from '../../features/tasks/schemas/task'
import type { Entitlement } from '../../shared/constants/billing'
import { computeFocusOrbit } from '../../features/focus-orbit/utils/compute'

const PLAN_PLUS: Entitlement[] = ['focus_orbit', 'focus_sessions', 'workload_map']

function task(partial: Partial<Task> & Pick<Task, 'id' | 'title'>): Task {
  return {
    id: partial.id,
    userId: 'user_test',
    title: partial.title,
    description: null,
    status: partial.status ?? 'todo',
    priority: partial.priority ?? 'medium',
    dueDate: partial.dueDate ?? null,
    tags: [],
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: null,
    ...partial
  }
}

describe('Focus Orbit aggregation', () => {
  const now = new Date('2026-07-25T12:00:00.000Z')

  const tasks: Task[] = [
    task({
      id: 't1',
      title: 'Urgent due today',
      priority: 'urgent',
      dueDate: '2026-07-25T12:00:00.000Z'
    }),
    task({
      id: 't2',
      title: 'Later work',
      priority: 'low',
      dueDate: '2026-08-01T12:00:00.000Z'
    }),
    task({
      id: 't3',
      title: 'Done item',
      status: 'done',
      dueDate: '2026-07-20T12:00:00.000Z'
    })
  ]

  it('builds plus payload without pro-only fields', () => {
    const payload = computeFocusOrbit(tasks, 'plus', PLAN_PLUS, { now })
    expect(payload.nodes.length).toBe(2)
    expect(payload.sessions.length).toBeGreaterThan(0)
    expect(payload.workload.length).toBe(7)
    expect(payload.forecast).toBeNull()
    expect(payload.recommendations).toBeNull()
    expect(payload.whatIf).toBeNull()
  })

  it('includes pro forecasting and what-if', () => {
    const payload = computeFocusOrbit(
      tasks,
      'pro',
      [
        'focus_orbit',
        'focus_sessions',
        'workload_map',
        'risk_forecast',
        'recommendations',
        'what_if'
      ],
      { now, capacityHours: 2 }
    )
    expect(payload.forecast?.length).toBe(7)
    expect(payload.recommendations?.length).toBeGreaterThan(0)
    expect(payload.whatIf?.capacityHours).toBe(2)
    expect(payload.summary.critical).toBeGreaterThan(0)
  })
})

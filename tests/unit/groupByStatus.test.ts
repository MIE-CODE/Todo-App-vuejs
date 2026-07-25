import { describe, expect, it } from 'vitest'
import { createTaskFactory } from '#features/tasks/utils/factory'
import { groupTasksByStatus, isBoardStatus } from '#features/tasks/utils/groupByStatus'

describe('groupTasksByStatus', () => {
  it('buckets tasks into todo / in_progress / done and drops archived', () => {
    const tasks = [
      createTaskFactory('u1', {
        title: 'A',
        status: 'todo',
        priority: 'low',
        tags: [],
        description: null
      }),
      createTaskFactory('u1', {
        title: 'B',
        status: 'in_progress',
        priority: 'medium',
        tags: [],
        description: null
      }),
      createTaskFactory('u1', {
        title: 'C',
        status: 'done',
        priority: 'high',
        tags: [],
        description: null
      }),
      createTaskFactory('u1', {
        title: 'D',
        status: 'archived',
        priority: 'low',
        tags: [],
        description: null
      })
    ]

    const groups = groupTasksByStatus(tasks)
    expect(groups.todo).toHaveLength(1)
    expect(groups.in_progress).toHaveLength(1)
    expect(groups.done).toHaveLength(1)
    expect(groups.todo[0]?.title).toBe('A')
  })

  it('returns empty columns for an empty list', () => {
    expect(groupTasksByStatus([])).toEqual({
      todo: [],
      in_progress: [],
      done: []
    })
  })
})

describe('isBoardStatus', () => {
  it('accepts board columns only', () => {
    expect(isBoardStatus('todo')).toBe(true)
    expect(isBoardStatus('archived')).toBe(false)
    expect(isBoardStatus('nope')).toBe(false)
  })
})

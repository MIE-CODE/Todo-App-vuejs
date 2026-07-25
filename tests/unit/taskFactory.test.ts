import { describe, expect, it } from 'vitest'
import { createTaskFactory } from '#features/tasks/utils/factory'

describe('createTaskFactory', () => {
  it('builds a valid task with version 1', () => {
    const task = createTaskFactory('user_1', {
      title: 'Write tests first',
      description: null,
      status: 'todo',
      priority: 'high',
      dueDate: null,
      tags: ['testing']
    })

    expect(task.userId).toBe('user_1')
    expect(task.version).toBe(1)
    expect(task.completedAt).toBeNull()
    expect(task.id.length).toBeGreaterThan(5)
  })
})

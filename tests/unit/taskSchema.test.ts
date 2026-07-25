import { describe, expect, it } from 'vitest'
import { createTaskSchema, updateTaskSchema } from '#features/tasks/schemas/task'

describe('task schemas', () => {
  it('requires a non-empty title on create', () => {
    const result = createTaskSchema.safeParse({ title: '   ' })
    expect(result.success).toBe(false)
  })

  it('applies create defaults', () => {
    const result = createTaskSchema.parse({ title: 'Ship Tasks slice' })
    expect(result.status).toBe('todo')
    expect(result.priority).toBe('medium')
    expect(result.tags).toEqual([])
  })

  it('requires version and at least one patch field', () => {
    const missingFields = updateTaskSchema.safeParse({ version: 1 })
    expect(missingFields.success).toBe(false)

    const valid = updateTaskSchema.safeParse({ version: 2, title: 'Updated' })
    expect(valid.success).toBe(true)
  })
})

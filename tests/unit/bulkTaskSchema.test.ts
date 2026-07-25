import { describe, expect, it } from 'vitest'
import { bulkTaskActionSchema } from '#features/tasks/schemas/task'

describe('bulkTaskActionSchema', () => {
  it('accepts complete and delete without a status', () => {
    expect(
      bulkTaskActionSchema.safeParse({ action: 'complete', ids: ['a', 'b'] }).success
    ).toBe(true)
    expect(bulkTaskActionSchema.safeParse({ action: 'delete', ids: ['a'] }).success).toBe(true)
  })

  it('requires a non-archived status for move', () => {
    expect(
      bulkTaskActionSchema.safeParse({ action: 'move', ids: ['a'], status: 'in_progress' }).success
    ).toBe(true)
    expect(bulkTaskActionSchema.safeParse({ action: 'move', ids: ['a'] }).success).toBe(false)
    expect(
      bulkTaskActionSchema.safeParse({ action: 'move', ids: ['a'], status: 'archived' }).success
    ).toBe(false)
  })

  it('rejects an empty ids list', () => {
    expect(bulkTaskActionSchema.safeParse({ action: 'delete', ids: [] }).success).toBe(false)
  })
})

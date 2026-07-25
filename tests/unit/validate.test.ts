import { describe, expect, it } from 'vitest'
import { flattenZodError } from '../../server/utils/validate'
import { z } from 'zod'

describe('flattenZodError', () => {
  it('maps nested paths to field error arrays', () => {
    const schema = z.object({
      title: z.string().min(1),
      tags: z.array(z.string()).min(1)
    })

    const result = schema.safeParse({ title: '', tags: [] })
    expect(result.success).toBe(false)

    if (!result.success) {
      const details = flattenZodError(result.error)
      expect(details.title?.length).toBeGreaterThan(0)
      expect(details.tags?.length).toBeGreaterThan(0)
    }
  })
})

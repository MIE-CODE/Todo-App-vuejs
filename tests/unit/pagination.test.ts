import { describe, expect, it } from 'vitest'
import { buildPaginationMeta } from '#shared/schemas/pagination'

describe('buildPaginationMeta', () => {
  it('computes total pages and navigation flags', () => {
    const meta = buildPaginationMeta(2, 10, 25)

    expect(meta).toEqual({
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true
    })
  })

  it('never returns zero total pages', () => {
    const meta = buildPaginationMeta(1, 10, 0)
    expect(meta.totalPages).toBe(1)
    expect(meta.hasNextPage).toBe(false)
  })
})

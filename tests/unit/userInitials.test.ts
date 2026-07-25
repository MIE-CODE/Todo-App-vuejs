import { describe, expect, it } from 'vitest'
import { getInitials } from '#shared/utils/user'

describe('getInitials', () => {
  it('takes first and last initials for multi-word names', () => {
    expect(getInitials('Ada Lovelace')).toBe('AL')
    expect(getInitials('Grace Brewster Hopper')).toBe('GH')
  })

  it('takes the first two letters of a single name', () => {
    expect(getInitials('Linus')).toBe('LI')
  })

  it('falls back for empty input', () => {
    expect(getInitials('   ')).toBe('?')
  })
})

import { describe, expect, it } from 'vitest'
import { deriveProviderAccountId, mockProviderProfile } from '../../server/services/oauthService'

describe('oauth provider adapters', () => {
  it('derives a stable, provider-scoped account id from email', () => {
    const a = deriveProviderAccountId('google', 'Ada@Example.com')
    const b = deriveProviderAccountId('google', 'ada@example.com')
    expect(a).toBe(b)
    expect(a.startsWith('google_')).toBe(true)
  })

  it('scopes account ids per provider', () => {
    const google = deriveProviderAccountId('google', 'x@y.z')
    const github = deriveProviderAccountId('github', 'x@y.z')
    expect(google).not.toBe(github)
  })

  it('produces a complete profile for each provider', () => {
    const google = mockProviderProfile('google')
    expect(google.provider).toBe('google')
    expect(google.email).toContain('@')
    expect(google.name.length).toBeGreaterThan(0)
    expect(google.providerAccountId).toBe(
      deriveProviderAccountId('google', google.email)
    )

    const github = mockProviderProfile('github')
    expect(github.provider).toBe('github')
  })
})

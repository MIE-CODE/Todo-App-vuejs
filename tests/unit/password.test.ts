import { describe, expect, it } from 'vitest'
import { hashPassword, hashPasswordSync, verifyPassword } from '../../server/utils/password'

describe('password hashing', () => {
  it('verifies a correct password (async hash)', async () => {
    const hash = await hashPassword('Secret123')
    expect(hash.startsWith('scrypt$')).toBe(true)
    expect(await verifyPassword('Secret123', hash)).toBe(true)
  })

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Secret123')
    expect(await verifyPassword('Wrong123', hash)).toBe(false)
  })

  it('verifies a sync-seeded hash', async () => {
    const hash = hashPasswordSync('Demo123!pass')
    expect(await verifyPassword('Demo123!pass', hash)).toBe(true)
  })

  it('produces distinct hashes for the same password (random salt)', async () => {
    const a = await hashPassword('samePassword1')
    const b = await hashPassword('samePassword1')
    expect(a).not.toBe(b)
  })

  it('returns false for malformed stored hashes', async () => {
    expect(await verifyPassword('x', 'not-a-hash')).toBe(false)
    expect(await verifyPassword('x', 'scrypt$only-two')).toBe(false)
  })
})

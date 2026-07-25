import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rateLimit, resetRateLimits } from '../../server/utils/rateLimit'

// getRequestIP is a Nitro/H3 auto-import (global in the server runtime).
// Stub it here so the pure limiter logic can be exercised in isolation.
const globalWithHelpers = globalThis as typeof globalThis & {
  getRequestIP?: () => string
}

function fakeEvent() {
  return { node: { res: { setHeader: vi.fn() } } } as never
}

describe('rateLimit', () => {
  beforeEach(() => {
    resetRateLimits()
    globalWithHelpers.getRequestIP = () => '203.0.113.1'
  })

  afterEach(() => {
    delete globalWithHelpers.getRequestIP
  })

  it('allows requests up to the limit then throws', () => {
    const event = fakeEvent()
    const options = { key: 'test', limit: 3, windowMs: 60_000 }

    expect(() => rateLimit(event, options)).not.toThrow()
    expect(() => rateLimit(event, options)).not.toThrow()
    expect(() => rateLimit(event, options)).not.toThrow()
    expect(() => rateLimit(event, options)).toThrowError(/too many/i)
  })

  it('tracks separate buckets per key', () => {
    const event = fakeEvent()
    expect(() => rateLimit(event, { key: 'a', limit: 1, windowMs: 60_000 })).not.toThrow()
    // Different key is independent.
    expect(() => rateLimit(event, { key: 'b', limit: 1, windowMs: 60_000 })).not.toThrow()
  })

  it('resets after the window elapses', () => {
    vi.useFakeTimers()
    const event = fakeEvent()
    const options = { key: 'windowed', limit: 1, windowMs: 1000 }

    expect(() => rateLimit(event, options)).not.toThrow()
    expect(() => rateLimit(event, options)).toThrow()

    vi.advanceTimersByTime(1500)
    expect(() => rateLimit(event, options)).not.toThrow()
    vi.useRealTimers()
  })
})

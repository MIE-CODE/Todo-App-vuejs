import type { H3Event } from 'h3'
import { rateLimitedError } from './errors'

interface Bucket {
  count: number
  resetAt: number
}

/**
 * In-process fixed-window rate limiter.
 *
 * Suitable for a single-node, self-contained app. A distributed deployment
 * would swap this for a shared store (Redis), but the call sites stay the same.
 */
const buckets = new Map<string, Bucket>()

export function rateLimit(
  event: H3Event,
  options: { key: string; limit: number; windowMs: number }
): void {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const bucketKey = `${options.key}:${ip}`
  const now = Date.now()
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt < now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
    return
  }

  existing.count += 1

  if (existing.count > options.limit) {
    const retryAfter = Math.ceil((existing.resetAt - now) / 1000)
    event.node.res.setHeader('Retry-After', String(retryAfter))
    throw rateLimitedError()
  }
}

/** Testing/maintenance helper. */
export function resetRateLimits(): void {
  buckets.clear()
}

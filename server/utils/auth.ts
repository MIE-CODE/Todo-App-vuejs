import type { H3Event } from 'h3'
import type { Entitlement } from '#shared/constants/billing'
import { planHasEntitlement } from '#shared/constants/billing'
import type { SessionUser } from '#shared/types/api'
import { forbiddenError, unauthorizedError } from './errors'
import { getOptionalUser } from './session'

/**
 * Guards a handler: returns the authenticated user or throws 401.
 * Real authentication only — no dev/demo auto-sessions.
 */
export async function requireUser(event: H3Event): Promise<SessionUser> {
  const user = await getOptionalUser(event)

  if (!user) {
    throw unauthorizedError()
  }

  return user
}

/**
 * Requires a confirmed plan entitlement. UI locks are convenience only —
 * this is the real gate for premium API payloads.
 */
export async function requireEntitlement(
  event: H3Event,
  entitlement: Entitlement
): Promise<SessionUser> {
  const user = await requireUser(event)

  if (!planHasEntitlement(user.planId, entitlement) || user.planStatus !== 'active') {
    throw forbiddenError(
      'This Focus Orbit feature requires an active Plus or Pro plan after payment is confirmed.'
    )
  }

  return user
}

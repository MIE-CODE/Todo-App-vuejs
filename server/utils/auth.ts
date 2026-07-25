import type { H3Event } from 'h3'
import type { SessionUser } from '#shared/types/api'
import { unauthorizedError } from './errors'
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

import { randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '#shared/constants/app'
import { forbiddenError } from './errors'

/**
 * Double-submit CSRF protection.
 *
 * A readable (non-httpOnly) token cookie is mirrored back in a request header.
 * A cross-site attacker can trigger requests but cannot read our cookie to set
 * the matching header, so forged mutations fail. Combined with an Origin check
 * (server middleware) this gives layered protection for a cookie-auth app.
 */
export function ensureCsrfCookie(event: H3Event): string {
  const existing = getCookie(event, CSRF_COOKIE_NAME)
  if (existing) {
    return existing
  }

  const token = randomBytes(24).toString('hex')
  setCookie(event, CSRF_COOKIE_NAME, token, {
    httpOnly: false,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 60 * 60 * 24 * 14
  })
  return token
}

export function assertCsrf(event: H3Event): void {
  const cookieToken = getCookie(event, CSRF_COOKIE_NAME)
  const headerToken = getHeader(event, CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    throw forbiddenError('Invalid or missing CSRF token')
  }
}

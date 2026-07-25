/**
 * Origin enforcement for state-changing API requests.
 *
 * For cookie-authenticated apps this is a primary CSRF defense: browsers always
 * send Origin on cross-site POST/PUT/PATCH/DELETE, and we reject mismatches.
 * Safe methods (GET/HEAD/OPTIONS) are never blocked.
 */
const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/')) {
    return
  }

  if (SAFE_METHODS.has(event.method)) {
    return
  }

  const origin = getHeader(event, 'origin')
  const host = getHeader(event, 'host')

  // Same-origin requests from our own app always carry a matching Origin host.
  if (origin) {
    try {
      const originHost = new URL(origin).host
      if (originHost === host) {
        return
      }
    } catch {
      // fall through to rejection
    }

    throw createError({
      statusCode: 403,
      statusMessage: 'Cross-origin request rejected',
      data: { code: 'FORBIDDEN', message: 'Cross-origin request rejected' }
    })
  }

  // No Origin header (e.g. some same-origin form posts) — allow; CSRF token still guards auth.
})

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME, SESSION_TTL_MS } from '#shared/constants/app'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

/**
 * Provides a preconfigured `$api` fetch client.
 *
 * - On the client it ensures a CSRF token cookie exists and mirrors it into a
 *   request header (double-submit pattern). Double-submit is secure because a
 *   cross-site attacker can neither read nor set cookies on our origin, so it
 *   cannot produce a matching header — the server only checks cookie === header.
 * - On the server it forwards the incoming request cookies so SSR data fetching
 *   is authenticated as the current user.
 * - On successful client responses, the local session expiry slides forward so
 *   the auto-logout timer stays aligned with the server's sliding cookie.
 *
 * All stores/composables use `$api` instead of the global `$fetch` so these
 * concerns live in exactly one place.
 */
export default defineNuxtPlugin(() => {
  const api = $fetch.create({
    onRequest({ options }) {
      const headers = new Headers(options.headers as HeadersInit | undefined)

      if (import.meta.server) {
        const cookie = useRequestHeaders(['cookie']).cookie
        if (cookie) {
          headers.set('cookie', cookie)
        }
      } else {
        headers.set(CSRF_HEADER_NAME, ensureCsrfToken())
      }

      options.headers = headers
    },
    onResponse({ response }) {
      if (import.meta.server || !response.ok) {
        return
      }
      // Mirror the server's sliding session: any successful authenticated call
      // extends the local auto-logout deadline.
      const auth = useAuthStore()
      if (auth.isAuthenticated) {
        auth.sessionExpiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString()
      }
    }
  })

  return {
    provide: { api }
  }
})

function readCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return match?.[1] ? decodeURIComponent(match[1]) : null
}

function ensureCsrfToken(): string {
  const existing = readCookie(CSRF_COOKIE_NAME)
  if (existing) {
    return existing
  }

  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')

  const secure = location.protocol === 'https:' ? '; secure' : ''
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; samesite=lax; max-age=1209600${secure}`
  return token
}

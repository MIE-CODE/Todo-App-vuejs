import { randomBytes } from 'node:crypto'
import { oauthProviderSchema } from '#shared/schemas/auth'
import { assertCsrf } from '../../../../utils/csrf'
import { defineApiHandler } from '../../../../utils/defineApiHandler'
import { validationError } from '../../../../utils/errors'
import { rateLimit } from '../../../../utils/rateLimit'

const OAUTH_STATE_COOKIE = 'taskflow_oauth_state'

/**
 * Step 1 of the simulated OAuth flow: issue an anti-forgery `state`, stash it in
 * a short-lived httpOnly cookie, and return the authorize URL the client should
 * navigate to. This mirrors a real provider's /authorize redirect handshake.
 */
export default defineApiHandler(async (event) => {
  rateLimit(event, { key: 'auth:oauth-start', limit: 20, windowMs: 60_000 })
  assertCsrf(event)

  const providerParam = getRouterParam(event, 'provider')
  const parsed = oauthProviderSchema.safeParse(providerParam)
  if (!parsed.success) {
    throw validationError('Unsupported provider')
  }
  const provider = parsed.data

  const state = randomBytes(16).toString('hex')
  setCookie(event, OAUTH_STATE_COOKIE, `${provider}:${state}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: !import.meta.dev,
    path: '/',
    maxAge: 300
  })

  return {
    authorizeUrl: `/api/auth/oauth/${provider}/callback?state=${state}`
  }
})

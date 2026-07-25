import { oauthProviderSchema } from '#shared/schemas/auth'
import { mockProviderProfile, resolveOAuthLogin } from '../../../../services/oauthService'
import { ensureCsrfCookie } from '../../../../utils/csrf'
import { defineApiHandler } from '../../../../utils/defineApiHandler'
import { createSession } from '../../../../utils/session'

const OAUTH_STATE_COOKIE = 'taskflow_oauth_state'

/**
 * Step 2 of the simulated OAuth flow: verify the `state` against the cookie,
 * resolve (or create/link) the account for the provider identity, start a
 * session, and redirect into the app — exactly like a real provider callback.
 *
 * GET is intentional: this is the browser landing on the redirect URL.
 */
export default defineApiHandler(async (event) => {
  const providerParam = getRouterParam(event, 'provider')
  const parsed = oauthProviderSchema.safeParse(providerParam)
  if (!parsed.success) {
    return sendRedirect(event, '/login?error=oauth_provider', 302)
  }
  const provider = parsed.data

  const query = getQuery(event)
  const state = typeof query.state === 'string' ? query.state : ''
  const cookieState = getCookie(event, OAUTH_STATE_COOKIE)
  deleteCookie(event, OAUTH_STATE_COOKIE, { path: '/' })

  if (!state || cookieState !== `${provider}:${state}`) {
    return sendRedirect(event, '/login?error=oauth_state', 302)
  }

  const profile = mockProviderProfile(provider)
  const user = await resolveOAuthLogin(profile)

  await createSession(event, user.id)
  ensureCsrfCookie(event)

  return sendRedirect(event, '/dashboard', 302)
})

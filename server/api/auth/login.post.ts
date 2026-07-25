import { loginSchema } from '#shared/schemas/auth'
import { createAuthService } from '../../services/authService'
import { assertCsrf, ensureCsrfCookie } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { rateLimit } from '../../utils/rateLimit'
import { createSession } from '../../utils/session'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  // Tight limit to blunt credential-stuffing on a single node.
  rateLimit(event, { key: 'auth:login', limit: 10, windowMs: 60_000 })
  assertCsrf(event)

  const body = parseOrThrow(loginSchema, await readBody(event))
  const service = createAuthService()
  const user = await service.login(body)

  await createSession(event, user.id)
  ensureCsrfCookie(event)
  return { user }
})

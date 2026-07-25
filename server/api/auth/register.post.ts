import { registerSchema } from '#shared/schemas/auth'
import { createAuthService } from '../../services/authService'
import { assertCsrf, ensureCsrfCookie } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { rateLimit } from '../../utils/rateLimit'
import { createSession } from '../../utils/session'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  rateLimit(event, { key: 'auth:register', limit: 10, windowMs: 60_000 })
  assertCsrf(event)

  const body = parseOrThrow(registerSchema, await readBody(event))
  const service = createAuthService()
  const user = await service.register(body)

  await createSession(event, user.id)
  ensureCsrfCookie(event)
  setResponseStatus(event, 201)
  return { user }
})

import { createUserRepository } from '../../repositories/userRepository'
import { ensureCsrfCookie } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { getOptionalUser } from '../../utils/session'

/**
 * Current-session endpoint. Also (re)issues the CSRF token cookie so the client
 * has it available before performing any mutation.
 */
export default defineApiHandler(async (event) => {
  ensureCsrfCookie(event)

  const user = await getOptionalUser(event)

  if (!user) {
    return { user: null, preferences: null }
  }

  const repository = createUserRepository()
  const preferences = await repository.getPreferences(user.id)

  return { user, preferences }
})

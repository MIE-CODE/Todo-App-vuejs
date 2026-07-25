import { updatePreferencesSchema } from '#shared/schemas/auth'
import { createUserRepository } from '../../repositories/userRepository'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  assertCsrf(event)
  const user = await requireUser(event)
  const body = parseOrThrow(updatePreferencesSchema, await readBody(event))

  const repository = createUserRepository()
  const preferences = await repository.updatePreferences(user.id, body)

  return { preferences }
})

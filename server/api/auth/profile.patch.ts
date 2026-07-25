import { updateProfileSchema } from '#shared/schemas/auth'
import { createUserRepository } from '../../repositories/userRepository'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  assertCsrf(event)
  const user = await requireUser(event)
  const body = parseOrThrow(updateProfileSchema, await readBody(event))

  const repository = createUserRepository()
  await repository.updateProfile(user.id, { name: body.name })

  const record = await repository.findById(user.id)
  return { user: record ? await repository.toSessionUser(record) : user }
})

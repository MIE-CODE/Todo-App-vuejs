import { changePasswordSchema } from '#shared/schemas/auth'
import { createAuthService } from '../../services/authService'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { revokeOtherSessions } from '../../utils/session'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  assertCsrf(event)
  const user = await requireUser(event)
  const body = parseOrThrow(changePasswordSchema, await readBody(event))

  const service = createAuthService()
  await service.changePassword(user.id, body.currentPassword, body.newPassword)

  // Changing credentials invalidates other sessions defensively.
  await revokeOtherSessions(event, user.id)

  return { success: true }
})

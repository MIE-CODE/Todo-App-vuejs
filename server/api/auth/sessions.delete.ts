import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { revokeOtherSessions } from '../../utils/session'

/** Revokes every session except the current one ("log out other devices"). */
export default defineApiHandler(async (event) => {
  assertCsrf(event)
  const user = await requireUser(event)
  const revoked = await revokeOtherSessions(event, user.id)
  return { revoked }
})

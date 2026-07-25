import { requireUser } from '../../utils/auth'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { listSessions } from '../../utils/session'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const sessions = await listSessions(event, user.id)
  return { sessions }
})

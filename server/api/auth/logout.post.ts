import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { destroyCurrentSession } from '../../utils/session'

export default defineApiHandler(async (event) => {
  assertCsrf(event)
  await destroyCurrentSession(event)
  return { success: true }
})

import { requireUser } from '../../utils/auth'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { createAnalyticsService } from '../../services/analyticsService'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const service = createAnalyticsService()
  return service.analytics(user.id)
})

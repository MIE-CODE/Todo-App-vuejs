import { createBillingService } from '../../services/billingService'
import { requireUser } from '../../utils/auth'
import { defineApiHandler } from '../../utils/defineApiHandler'

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const service = createBillingService()
  const subscription = await service.getSubscription(user.id)
  return { subscription, user }
})

import { createBillingService } from '../../services/billingService'
import { defineApiHandler } from '../../utils/defineApiHandler'

export default defineApiHandler(async () => {
  const service = createBillingService()
  const plans = await service.listPlans()
  return { plans }
})

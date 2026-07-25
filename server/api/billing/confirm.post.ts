import { confirmPaymentSchema } from '#shared/schemas/billing'
import { createBillingService } from '../../services/billingService'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { rateLimit } from '../../utils/rateLimit'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  rateLimit(event, { key: 'billing:confirm', limit: 15, windowMs: 60_000 })
  assertCsrf(event)

  const user = await requireUser(event)
  const body = parseOrThrow(confirmPaymentSchema, await readBody(event))
  const service = createBillingService()
  const result = await service.confirmPayment(user.id, body)

  return result
})

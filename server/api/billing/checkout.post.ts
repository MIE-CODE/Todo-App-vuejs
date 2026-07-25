import { checkoutSchema } from '#shared/schemas/billing'
import { createBillingService } from '../../services/billingService'
import { requireUser } from '../../utils/auth'
import { assertCsrf } from '../../utils/csrf'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { rateLimit } from '../../utils/rateLimit'
import { parseOrThrow } from '../../utils/validate'

export default defineApiHandler(async (event) => {
  rateLimit(event, { key: 'billing:checkout', limit: 20, windowMs: 60_000 })
  assertCsrf(event)

  const user = await requireUser(event)
  const body = parseOrThrow(checkoutSchema, await readBody(event))
  const service = createBillingService()
  const payment = await service.createCheckout(user.id, body)

  return { payment }
})

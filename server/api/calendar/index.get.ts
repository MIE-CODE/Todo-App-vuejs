import { z } from 'zod'
import { requireUser } from '../../utils/auth'
import { defineApiHandler } from '../../utils/defineApiHandler'
import { parseOrThrow } from '../../utils/validate'
import { createAnalyticsService } from '../../services/analyticsService'

const calendarQuerySchema = z.object({
  year: z.coerce.number().int().min(1970).max(3000),
  month: z.coerce.number().int().min(1).max(12)
})

export default defineApiHandler(async (event) => {
  const user = await requireUser(event)
  const { year, month } = parseOrThrow(calendarQuerySchema, getQuery(event))

  const service = createAnalyticsService()
  const tasks = await service.calendarMonth(user.id, year, month)

  return { year, month, tasks }
})

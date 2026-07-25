import { createFocusOrbitService } from '../../services/focusOrbitService'
import { requireEntitlement } from '../../utils/auth'
import { defineApiHandler } from '../../utils/defineApiHandler'

/**
 * Premium Focus Orbit payload. Requires a confirmed Plus/Pro entitlement —
 * free clients only ever see the locked preview UI, never this data.
 */
export default defineApiHandler(async (event) => {
  const user = await requireEntitlement(event, 'focus_orbit')
  const query = getQuery(event)
  const rawCapacity = Number(query.capacityHours)
  const capacityHours = Number.isFinite(rawCapacity) ? rawCapacity : undefined

  const service = createFocusOrbitService()
  return service.forUser(user.id, { capacityHours })
})

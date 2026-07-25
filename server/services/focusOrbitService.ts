import type { FocusOrbitPayload } from '#features/focus-orbit/types'
import { computeFocusOrbit } from '#features/focus-orbit/utils/compute'
import { createBillingRepository } from '../repositories/billingRepository'
import { createTaskRepository } from '../repositories/taskRepository'

export function createFocusOrbitService() {
  const tasks = createTaskRepository()
  const billing = createBillingRepository()

  return {
    async forUser(
      userId: string,
      options: { capacityHours?: number } = {}
    ): Promise<FocusOrbitPayload> {
      const [allTasks, subscription] = await Promise.all([
        tasks.allForUser(userId),
        billing.getSubscription(userId)
      ])

      return computeFocusOrbit(allTasks, subscription.planId, subscription.entitlements, {
        capacityHours: options.capacityHours
      })
    }
  }
}

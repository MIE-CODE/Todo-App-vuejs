import type { FocusOrbitPayload } from '#features/focus-orbit/types'
import { extractApiErrorMessage } from '#shared/utils/apiError'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

export function useFocusOrbit() {
  const { $api } = useNuxtApp()
  const auth = useAuthStore()

  const capacityHours = ref(4)
  const unlocked = computed(() => auth.user?.entitlements.includes('focus_orbit') ?? false)

  const asyncData = useAsyncData<FocusOrbitPayload | null>(
    'focus-orbit',
    async () => {
      if (!auth.user?.entitlements.includes('focus_orbit')) {
        return null
      }
      return $api<FocusOrbitPayload>('/api/analytics/focus-orbit', {
        query: { capacityHours: capacityHours.value }
      })
    },
    {
      watch: [capacityHours, () => auth.user?.planId, () => auth.user?.entitlements.join(',')]
    }
  )

  async function refreshOrbit(): Promise<void> {
    await asyncData.refresh()
  }

  return {
    ...asyncData,
    capacityHours,
    unlocked,
    refreshOrbit,
    errorMessage: computed(() =>
      asyncData.error.value ? extractApiErrorMessage(asyncData.error.value) : null
    )
  }
}

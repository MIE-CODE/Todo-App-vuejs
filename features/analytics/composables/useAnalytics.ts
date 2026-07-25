import type { TaskAnalytics } from '#features/analytics/types'

/** SSR-friendly analytics loader; the server computes all figures. */
export function useAnalytics() {
  const { $api } = useNuxtApp()
  return useAsyncData<TaskAnalytics>('analytics', () => $api<TaskAnalytics>('/api/analytics'))
}

import type { DashboardCharts, DashboardSummary } from '#features/analytics/types'
import type { Task } from '#features/tasks/schemas/task'

export interface DashboardPayload {
  summary: DashboardSummary
  charts: DashboardCharts
  upcoming: Task[]
  overdue: Task[]
}

/**
 * SSR-friendly dashboard data loader.
 * Uses useAsyncData so the payload is fetched on the server and hydrated
 * without a second client request, and can be refreshed on demand.
 */
export function useDashboard() {
  const { $api } = useNuxtApp()

  return useAsyncData<DashboardPayload>('dashboard', () => $api<DashboardPayload>('/api/dashboard'))
}

import type { TaskPriority } from '#shared/constants/app'
import type { Entitlement, PlanId } from '#shared/constants/billing'

export interface OrbitNode {
  id: string
  title: string
  priority: TaskPriority
  dueDate: string | null
  status: string
  /** Angle in degrees around the orbit ring. */
  angle: number
  /** 0–1 distance from center (urgency / due proximity). */
  radius: number
  risk: 'calm' | 'watch' | 'critical'
}

export interface FocusSessionSlot {
  id: string
  label: string
  startHour: number
  durationMinutes: number
  taskIds: string[]
  focusScore: number
}

export interface WorkloadDay {
  date: string
  label: string
  openCount: number
  load: number
  band: 'light' | 'steady' | 'heavy'
}

export interface RiskForecastPoint {
  date: string
  projectedOverdue: number
  capacityGap: number
}

export interface OrbitRecommendation {
  id: string
  title: string
  reason: string
  taskId: string | null
  impact: 'high' | 'medium' | 'low'
}

export interface WhatIfScenario {
  capacityHours: number
  completableToday: number
  leftoverRisk: number
  advice: string
}

export interface FocusOrbitPayload {
  planId: PlanId
  entitlements: Entitlement[]
  summary: {
    openTasks: number
    dueSoon: number
    critical: number
    focusScore: number
  }
  nodes: OrbitNode[]
  sessions: FocusSessionSlot[]
  workload: WorkloadDay[]
  /** Pro-only; omitted (null) for Plus. */
  forecast: RiskForecastPoint[] | null
  recommendations: OrbitRecommendation[] | null
  whatIf: WhatIfScenario | null
}

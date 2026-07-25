import type { Task } from '#features/tasks/schemas/task'
import type { Entitlement, PlanId } from '#shared/constants/billing'
import { planHasEntitlement } from '#shared/constants/billing'
import type {
  FocusOrbitPayload,
  FocusSessionSlot,
  OrbitNode,
  OrbitRecommendation,
  RiskForecastPoint,
  WhatIfScenario,
  WorkloadDay
} from '#features/focus-orbit/types'

function isOpen(task: Task): boolean {
  return task.status !== 'done' && task.status !== 'archived'
}

function startOfDay(date: Date): Date {
  const copy = new Date(date)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function daysUntil(dueDate: string | null, now: Date): number | null {
  if (!dueDate) {
    return null
  }
  const due = startOfDay(new Date(dueDate))
  const today = startOfDay(now)
  return Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

function riskFor(task: Task, now: Date): OrbitNode['risk'] {
  const days = daysUntil(task.dueDate, now)
  if (days == null) {
    return task.priority === 'urgent' || task.priority === 'high' ? 'watch' : 'calm'
  }
  if (days < 0 || (days <= 1 && (task.priority === 'urgent' || task.priority === 'high'))) {
    return 'critical'
  }
  if (days <= 3 || task.priority === 'urgent') {
    return 'watch'
  }
  return 'calm'
}

function radiusFor(task: Task, now: Date): number {
  const days = daysUntil(task.dueDate, now)
  if (days == null) {
    return 0.55
  }
  if (days < 0) {
    return 0.95
  }
  if (days === 0) {
    return 0.85
  }
  if (days <= 2) {
    return 0.7
  }
  if (days <= 7) {
    return 0.5
  }
  return 0.35
}

export function buildOrbitNodes(tasks: Task[], now: Date = new Date()): OrbitNode[] {
  const open = tasks.filter(isOpen)
  return open.map((task, index) => {
    const angle = open.length ? (360 / open.length) * index : 0
    return {
      id: task.id,
      title: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
      angle,
      radius: radiusFor(task, now),
      risk: riskFor(task, now)
    }
  })
}

export function buildWorkload(tasks: Task[], now: Date = new Date()): WorkloadDay[] {
  const open = tasks.filter(isOpen)
  const days: WorkloadDay[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const day = startOfDay(now)
    day.setUTCDate(day.getUTCDate() + offset)
    const key = day.toISOString().slice(0, 10)
    const next = new Date(day)
    next.setUTCDate(next.getUTCDate() + 1)

    const openCount = open.filter((task) => {
      if (!task.dueDate) {
        return offset === 0
      }
      const due = new Date(task.dueDate).getTime()
      return due >= day.getTime() && due < next.getTime()
    }).length

    const load = Math.min(1, openCount / 4)
    days.push({
      date: key,
      label: day.toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
      openCount,
      load,
      band: load >= 0.75 ? 'heavy' : load >= 0.4 ? 'steady' : 'light'
    })
  }

  return days
}

export function buildFocusSessions(tasks: Task[], now: Date = new Date()): FocusSessionSlot[] {
  const ranked = tasks
    .filter(isOpen)
    .sort((a, b) => {
      const riskScore = { critical: 3, watch: 2, calm: 1 } as const
      return riskScore[riskFor(b, now)] - riskScore[riskFor(a, now)]
    })

  const slots: Array<Omit<FocusSessionSlot, 'taskIds' | 'focusScore'> & { capacity: number }> = [
    { id: 'morning', label: 'Morning deep work', startHour: 9, durationMinutes: 90, capacity: 2 },
    { id: 'midday', label: 'Midday push', startHour: 13, durationMinutes: 60, capacity: 2 },
    { id: 'evening', label: 'Evening wrap-up', startHour: 17, durationMinutes: 45, capacity: 1 }
  ]

  let cursor = 0
  return slots.map((slot) => {
    const slice = ranked.slice(cursor, cursor + slot.capacity)
    cursor += slot.capacity
    const focusScore = slice.length
      ? Math.round(
          (slice.reduce((sum, task) => sum + (riskFor(task, now) === 'critical' ? 1 : 0.6), 0)
            / slot.capacity)
            * 100
        )
      : 0

    return {
      id: slot.id,
      label: slot.label,
      startHour: slot.startHour,
      durationMinutes: slot.durationMinutes,
      taskIds: slice.map((task) => task.id),
      focusScore
    }
  })
}

export function buildForecast(tasks: Task[], now: Date = new Date()): RiskForecastPoint[] {
  const open = tasks.filter(isOpen)
  const points: RiskForecastPoint[] = []

  for (let offset = 0; offset < 7; offset += 1) {
    const day = startOfDay(now)
    day.setUTCDate(day.getUTCDate() + offset)
    const key = day.toISOString().slice(0, 10)

    const projectedOverdue = open.filter((task) => {
      if (!task.dueDate) {
        return false
      }
      return new Date(task.dueDate).getTime() < day.getTime() + 1000 * 60 * 60 * 24
        && riskFor(task, now) !== 'calm'
    }).length

    const capacityGap = Math.max(0, projectedOverdue - 3)
    points.push({ date: key, projectedOverdue, capacityGap })
  }

  return points
}

export function buildRecommendations(tasks: Task[], now: Date = new Date()): OrbitRecommendation[] {
  const open = tasks.filter(isOpen)
  const critical = open.filter((task) => riskFor(task, now) === 'critical')
  const undated = open.filter((task) => !task.dueDate)
  const recommendations: OrbitRecommendation[] = []

  if (critical[0]) {
    recommendations.push({
      id: 'rec_critical',
      title: `Tackle “${critical[0].title}” next`,
      reason: 'Highest risk on your orbit — clear it before the ring collapses.',
      taskId: critical[0].id,
      impact: 'high'
    })
  }

  if (undated[0]) {
    recommendations.push({
      id: 'rec_undated',
      title: `Give “${undated[0].title}” a due date`,
      reason: 'Undated work hides in the outer ring and never surfaces on the calendar.',
      taskId: undated[0].id,
      impact: 'medium'
    })
  }

  const heavyDay = buildWorkload(tasks, now).find((day) => day.band === 'heavy')
  if (heavyDay) {
    recommendations.push({
      id: 'rec_rebalance',
      title: `Rebalance ${heavyDay.label}`,
      reason: `${heavyDay.openCount} open items land on that day — move one to lighten the load.`,
      taskId: null,
      impact: 'medium'
    })
  }

  if (!recommendations.length) {
    recommendations.push({
      id: 'rec_clear',
      title: 'Orbit looks calm',
      reason: 'Keep capturing tasks and Focus Orbit will surface the next move.',
      taskId: null,
      impact: 'low'
    })
  }

  return recommendations.slice(0, 3)
}

export function buildWhatIf(
  tasks: Task[],
  capacityHours: number,
  now: Date = new Date()
): WhatIfScenario {
  const hours = Math.min(12, Math.max(1, capacityHours))
  const slots = Math.max(1, Math.floor(hours * 1.2))
  const open = tasks.filter(isOpen)
  const completableToday = Math.min(slots, open.length)
  const leftoverRisk = Math.max(
    0,
    open.filter((task) => riskFor(task, now) !== 'calm').length - completableToday
  )

  let advice = 'Steady pace — you can clear today’s orbit.'
  if (leftoverRisk >= 3) {
    advice = 'Capacity is tight. Protect a deep-work block or defer low-priority items.'
  } else if (leftoverRisk > 0) {
    advice = 'Almost covered — one focused session should close the gap.'
  }

  return { capacityHours: hours, completableToday, leftoverRisk, advice }
}

export function computeFocusOrbit(
  tasks: Task[],
  planId: PlanId,
  entitlements: Entitlement[],
  options: { now?: Date; capacityHours?: number } = {}
): FocusOrbitPayload {
  const now = options.now ?? new Date()
  const nodes = buildOrbitNodes(tasks, now)
  const sessions = planHasEntitlement(planId, 'focus_sessions')
    ? buildFocusSessions(tasks, now)
    : []
  const workload = planHasEntitlement(planId, 'workload_map') ? buildWorkload(tasks, now) : []

  const hasProForecast = entitlements.includes('risk_forecast')
  const hasRecs = entitlements.includes('recommendations')
  const hasWhatIf = entitlements.includes('what_if')

  const critical = nodes.filter((node) => node.risk === 'critical').length
  const dueSoon = nodes.filter((node) => node.risk !== 'calm').length
  const focusScore = nodes.length
    ? Math.max(0, 100 - critical * 18 - Math.max(0, dueSoon - critical) * 8)
    : 100

  return {
    planId,
    entitlements,
    summary: {
      openTasks: nodes.length,
      dueSoon,
      critical,
      focusScore
    },
    nodes,
    sessions,
    workload,
    forecast: hasProForecast ? buildForecast(tasks, now) : null,
    recommendations: hasRecs ? buildRecommendations(tasks, now) : null,
    whatIf: hasWhatIf ? buildWhatIf(tasks, options.capacityHours ?? 4, now) : null
  }
}

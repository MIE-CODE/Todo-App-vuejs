/**
 * Billing plan catalog and entitlement map.
 * Plans are seeded in SQLite; this module is the shared source of truth for
 * IDs, prices, and which capabilities each confirmed plan unlocks.
 */

export const PLAN_IDS = ['free', 'plus', 'pro'] as const
export type PlanId = (typeof PLAN_IDS)[number]

export const ENTITLEMENTS = [
  'focus_orbit',
  'focus_sessions',
  'workload_map',
  'risk_forecast',
  'recommendations',
  'what_if',
  'task_reminders'
] as const
export type Entitlement = (typeof ENTITLEMENTS)[number]

export const PAYMENT_STATUSES = ['pending', 'confirmed', 'failed'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const SUBSCRIPTION_STATUSES = ['active', 'canceled'] as const
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number]

/** Monthly prices in USD cents. */
export const PLAN_PRICES_CENTS: Record<PlanId, number> = {
  free: 0,
  plus: 900,
  pro: 1900
}

export const PLAN_NAMES: Record<PlanId, string> = {
  free: 'Free',
  plus: 'Plus',
  pro: 'Pro'
}

export const PLAN_DESCRIPTIONS: Record<PlanId, string> = {
  free: 'Tasks, board, and calendar — everything you need to stay organized.',
  plus: 'Due times with task alarms, plus Focus Orbit: timeline, focus sessions, and workload map.',
  pro: 'Plus forecasting, next-best actions, and interactive capacity controls.'
}

export const PLAN_ENTITLEMENTS: Record<PlanId, readonly Entitlement[]> = {
  free: [],
  plus: ['focus_orbit', 'focus_sessions', 'workload_map', 'task_reminders'],
  pro: [
    'focus_orbit',
    'focus_sessions',
    'workload_map',
    'risk_forecast',
    'recommendations',
    'what_if',
    'task_reminders'
  ]
}

export const PLAN_FEATURES: Record<PlanId, readonly string[]> = {
  free: ['Unlimited tasks', 'Kanban board', 'Due-date calendar', 'Basic dashboard'],
  plus: [
    'Everything in Free',
    'Due times & task alarms',
    'Focus Orbit timeline',
    'Focus session planner',
    'Workload map'
  ],
  pro: [
    'Everything in Plus',
    'Risk forecasting',
    'Next-best-action recommendations',
    'What-if capacity controls'
  ]
}

/** Deterministic sandbox card outcomes (never store these numbers). */
export const SANDBOX_CARDS = {
  success: '4242424242424242',
  decline: '4000000000000002'
} as const

export function entitlementsForPlan(planId: PlanId): Entitlement[] {
  return [...PLAN_ENTITLEMENTS[planId]]
}

export function planHasEntitlement(planId: PlanId, entitlement: Entitlement): boolean {
  return PLAN_ENTITLEMENTS[planId].includes(entitlement)
}

export function formatPrice(cents: number): string {
  if (cents === 0) {
    return '$0'
  }
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`
}

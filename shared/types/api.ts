import type { OAuthProvider, ThemePreference, WeekStartDay } from '#shared/constants/app'
import type { Entitlement, PlanId, SubscriptionStatus } from '#shared/constants/billing'

/**
 * Shared API contract types.
 * Keep transport shapes here so client and server never drift.
 */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export interface ApiErrorBody {
  code: ApiErrorCode
  message: string
  details?: Record<string, string[]>
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface PaginatedResult<T> {
  data: T[]
  meta: PaginationMeta
}

export type SortDirection = 'asc' | 'desc'

export interface SessionUser {
  id: string
  email: string
  name: string
  emailVerified: boolean
  avatarColor: string
  /** Which providers this account can sign in with. */
  connectedProviders: OAuthProvider[]
  hasPassword: boolean
  /** Confirmed billing plan; defaults to free when no subscription row exists. */
  planId: PlanId
  planStatus: SubscriptionStatus
  entitlements: Entitlement[]
}

export interface BillingPlan {
  id: PlanId
  name: string
  description: string
  priceCents: number
  priceLabel: string
  features: string[]
  entitlements: Entitlement[]
  highlighted: boolean
}

export interface SubscriptionSummary {
  planId: PlanId
  status: SubscriptionStatus
  entitlements: Entitlement[]
  currentPeriodEnd: string | null
  updatedAt: string
}

export interface PaymentAttemptSummary {
  id: string
  planId: PlanId
  amountCents: number
  currency: string
  status: 'pending' | 'confirmed' | 'failed'
  failureReason: string | null
  createdAt: string
  confirmedAt: string | null
}

export interface UserPreferences {
  theme: ThemePreference
  defaultPriority: 'low' | 'medium' | 'high' | 'urgent'
  weekStart: WeekStartDay
}

export interface SessionSummary {
  id: string
  current: boolean
  userAgent: string | null
  createdAt: string
  lastUsedAt: string
  expiresAt: string
}

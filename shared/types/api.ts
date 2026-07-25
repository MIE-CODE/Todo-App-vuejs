import type { OAuthProvider, ThemePreference, WeekStartDay } from '#shared/constants/app'

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

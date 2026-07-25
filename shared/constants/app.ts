export const APP_NAME = 'TaskFlow' as const
export const APP_TAGLINE = 'A focused todo app to plan your day and finish what matters.' as const

export const SESSION_COOKIE_NAME = 'taskflow_session' as const
export const CSRF_COOKIE_NAME = 'taskflow_csrf' as const
export const CSRF_HEADER_NAME = 'x-taskflow-csrf' as const

/** Idle session lifetime. Activity slides the cookie + DB expiry forward. */
export const SESSION_TTL_MS = 1000 * 60 * 60 * 3

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

export const TASK_STATUSES = ['todo', 'in_progress', 'done', 'archived'] as const
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
export type TaskPriority = (typeof TASK_PRIORITIES)[number]

export const OAUTH_PROVIDERS = ['google', 'github'] as const
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export const THEME_PREFERENCES = ['light', 'dark', 'system'] as const
export type ThemePreference = (typeof THEME_PREFERENCES)[number]

export const WEEK_START_DAYS = ['sunday', 'monday'] as const
export type WeekStartDay = (typeof WEEK_START_DAYS)[number]

/** localStorage key for the per-user task board cache. */
export function taskStorageKey(userId: string): string {
  return `taskflow:tasks:${userId}`
}

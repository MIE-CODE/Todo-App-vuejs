import type { ApiErrorBody } from '#shared/types/api'

interface FetchErrorLike {
  data?: Partial<ApiErrorBody>
  statusMessage?: string
  message?: string
}

/** Pulls a user-facing message out of an ofetch/H3 error, with a safe fallback. */
export function extractApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as FetchErrorLike
    if (candidate.data?.message) {
      return candidate.data.message
    }
    if (candidate.statusMessage) {
      return candidate.statusMessage
    }
    if (candidate.message) {
      return candidate.message
    }
  }
  return fallback
}

/** Extracts per-field validation errors from an API error, if present. */
export function extractApiFieldErrors(error: unknown): Record<string, string[]> {
  if (typeof error === 'object' && error !== null) {
    const candidate = error as FetchErrorLike
    if (candidate.data?.details) {
      return candidate.data.details
    }
  }
  return {}
}

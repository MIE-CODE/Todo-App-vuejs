import type { ApiErrorCode } from '#shared/types/api'

/**
 * Typed HTTP errors for Nitro handlers.
 * Centralizing status mapping keeps API responses consistent.
 */
export class AppError extends Error {
  readonly statusCode: number
  readonly code: ApiErrorCode
  readonly details?: Record<string, string[]>

  constructor(
    statusCode: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, string[]>
  ) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function validationError(message: string, details?: Record<string, string[]>) {
  return new AppError(400, 'VALIDATION_ERROR', message, details)
}

export function unauthorizedError(message = 'Authentication required') {
  return new AppError(401, 'UNAUTHORIZED', message)
}

export function forbiddenError(message = 'You do not have access to this resource') {
  return new AppError(403, 'FORBIDDEN', message)
}

export function notFoundError(message = 'Resource not found') {
  return new AppError(404, 'NOT_FOUND', message)
}

export function conflictError(message: string) {
  return new AppError(409, 'CONFLICT', message)
}

export function rateLimitedError(message = 'Too many requests. Please slow down.') {
  return new AppError(429, 'RATE_LIMITED', message)
}

export function internalError(message = 'Unexpected server error') {
  return new AppError(500, 'INTERNAL_ERROR', message)
}

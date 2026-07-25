import type { H3Event } from 'h3'
import { AppError, internalError } from './errors'

type ApiHandler<T> = (event: H3Event) => Promise<T> | T

/**
 * Wrap handlers so AppError becomes a consistent JSON body.
 * Unexpected errors are logged and sanitized for the client.
 */
export function defineApiHandler<T>(handler: ApiHandler<T>) {
  return defineEventHandler(async (event) => {
    try {
      return await handler(event)
    } catch (error) {
      if (error instanceof AppError) {
        throw createError({
          statusCode: error.statusCode,
          statusMessage: error.message,
          data: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        })
      }

      console.error('[api]', error)
      const fallback = internalError()
      throw createError({
        statusCode: fallback.statusCode,
        statusMessage: fallback.message,
        data: {
          code: fallback.code,
          message: fallback.message
        }
      })
    }
  })
}

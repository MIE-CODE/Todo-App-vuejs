import type { ZodError, ZodType } from 'zod'
import { validationError } from './errors'

/**
 * Parse unknown input with Zod and map field errors into our API shape.
 */
export function parseOrThrow<TSchema extends ZodType>(
  schema: TSchema,
  input: unknown
): TSchema['_output'] {
  const result = schema.safeParse(input)

  if (!result.success) {
    throw validationError('Validation failed', flattenZodError(result.error))
  }

  return result.data
}

export function flattenZodError(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join('.') : '_form'

    if (!details[path]) {
      details[path] = []
    }

    details[path].push(issue.message)
  }

  return details
}

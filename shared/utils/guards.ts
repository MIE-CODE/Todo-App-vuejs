/**
 * Type guards and assertion helpers.
 * Prefer these over cast-heavy code so invalid states fail loudly.
 */

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

export function assertNever(value: never, message = 'Unexpected value'): never {
  throw new Error(`${message}: ${String(value)}`)
}

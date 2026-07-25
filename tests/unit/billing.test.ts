import { describe, expect, it } from 'vitest'
import {
  PLAN_ENTITLEMENTS,
  PLAN_PRICES_CENTS,
  planHasEntitlement,
  SANDBOX_CARDS
} from '../../shared/constants/billing'
import { checkoutSchema, confirmPaymentSchema } from '../../shared/schemas/billing'

/** Mirrors server/services/billingService sandbox rules without importing Nitro. */
function evaluateSandboxCard(cardNumber: string) {
  const digits = cardNumber.replace(/\s+/g, '')
  if (digits === SANDBOX_CARDS.success) {
    return { success: true }
  }
  if (digits === SANDBOX_CARDS.decline) {
    return { success: false }
  }
  return { success: false }
}

describe('billing schemas and sandbox cards', () => {
  it('rejects free plan checkout', () => {
    const result = checkoutSchema.safeParse({
      planId: 'free',
      idempotencyKey: 'idem_12345678'
    })
    expect(result.success).toBe(false)
  })

  it('accepts plus checkout with idempotency key', () => {
    const result = checkoutSchema.safeParse({
      planId: 'plus',
      idempotencyKey: 'idem_12345678'
    })
    expect(result.success).toBe(true)
  })

  it('normalizes spaced card numbers', () => {
    const result = confirmPaymentSchema.safeParse({
      attemptId: 'pay_1',
      cardNumber: '4242 4242 4242 4242',
      cardExpiry: '12/30',
      cardCvc: '123'
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cardNumber).toBe(SANDBOX_CARDS.success)
    }
  })

  it('evaluates sandbox cards deterministically', () => {
    expect(evaluateSandboxCard(SANDBOX_CARDS.success).success).toBe(true)
    expect(evaluateSandboxCard(SANDBOX_CARDS.decline).success).toBe(false)
    expect(evaluateSandboxCard('4111111111111111').success).toBe(false)
  })

  it('maps entitlements by plan', () => {
    expect(planHasEntitlement('free', 'focus_orbit')).toBe(false)
    expect(planHasEntitlement('plus', 'focus_orbit')).toBe(true)
    expect(planHasEntitlement('plus', 'what_if')).toBe(false)
    expect(planHasEntitlement('pro', 'what_if')).toBe(true)
    expect(PLAN_ENTITLEMENTS.pro).toContain('recommendations')
    expect(PLAN_PRICES_CENTS.plus).toBe(900)
  })
})

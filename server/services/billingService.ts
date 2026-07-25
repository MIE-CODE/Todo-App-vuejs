import type { PlanId } from '#shared/constants/billing'
import {
  PLAN_PRICES_CENTS,
  SANDBOX_CARDS
} from '#shared/constants/billing'
import type { CheckoutInput, ConfirmPaymentInput } from '#shared/schemas/billing'
import type {
  BillingPlan,
  PaymentAttemptSummary,
  SessionUser,
  SubscriptionSummary
} from '#shared/types/api'
import { createBillingRepository } from '../repositories/billingRepository'
import { createUserRepository } from '../repositories/userRepository'
import { conflictError, forbiddenError, notFoundError, validationError } from '../utils/errors'

/**
 * Local sandbox payment provider.
 * Card numbers are evaluated deterministically and never persisted.
 */
function evaluateSandboxCard(cardNumber: string): { success: boolean; reason: string | null } {
  if (cardNumber === SANDBOX_CARDS.success) {
    return { success: true, reason: null }
  }
  if (cardNumber === SANDBOX_CARDS.decline) {
    return { success: false, reason: 'Your card was declined by the sandbox processor.' }
  }
  // Any other number fails closed — only documented test cards succeed.
  return {
    success: false,
    reason: 'Unrecognized sandbox card. Use 4242 4242 4242 4242 to pay, or 4000 0000 0000 0002 to simulate a decline.'
  }
}

function isPaidPlan(planId: PlanId): planId is Exclude<PlanId, 'free'> {
  return planId === 'plus' || planId === 'pro'
}

export function createBillingService() {
  const billing = createBillingRepository()
  const users = createUserRepository()

  return {
    listPlans(): Promise<BillingPlan[]> {
      return billing.listPlans()
    },

    getSubscription(userId: string): Promise<SubscriptionSummary> {
      return billing.getSubscription(userId)
    },

    async ensureFreeSubscription(userId: string): Promise<void> {
      await billing.ensureFreeSubscription(userId)
    },

    async createCheckout(
      userId: string,
      input: CheckoutInput
    ): Promise<PaymentAttemptSummary> {
      if (!isPaidPlan(input.planId)) {
        throw validationError('Choose Plus or Pro to start checkout')
      }

      const existing = await billing.findAttemptByIdempotency(userId, input.idempotencyKey)
      if (existing) {
        if (existing.planId !== input.planId) {
          throw conflictError('Idempotency key already used for a different plan')
        }
        return billing.toPaymentSummary(existing)
      }

      const expectedAmount = PLAN_PRICES_CENTS[input.planId]
      const plan = await billing.getPlan(input.planId)
      if (!plan || plan.priceCents !== expectedAmount) {
        throw validationError('Unknown or inactive plan')
      }

      const current = await billing.getSubscription(userId)
      if (current.planId === input.planId && current.status === 'active') {
        throw conflictError(`You are already on the ${plan.name} plan`)
      }

      // Downgrade/upgrade both allowed; amount always comes from the catalog.
      const attempt = await billing.createPendingAttempt({
        userId,
        planId: input.planId,
        amountCents: expectedAmount,
        idempotencyKey: input.idempotencyKey
      })

      return billing.toPaymentSummary(attempt)
    },

    async confirmPayment(
      userId: string,
      input: ConfirmPaymentInput
    ): Promise<{
      payment: PaymentAttemptSummary
      subscription: SubscriptionSummary
      user: SessionUser
    }> {
      const attempt = await billing.findAttemptById(input.attemptId)

      if (!attempt || attempt.userId !== userId) {
        throw notFoundError('Payment attempt not found')
      }

      if (attempt.status === 'confirmed') {
        const subscription = await billing.getSubscription(userId)
        const record = await users.findById(userId)
        if (!record) {
          throw notFoundError('User not found')
        }
        return {
          payment: billing.toPaymentSummary(attempt),
          subscription,
          user: await users.toSessionUser(record)
        }
      }

      if (attempt.status === 'failed') {
        throw conflictError(
          attempt.failureReason ?? 'This payment already failed. Start a new checkout.'
        )
      }

      if (!isPaidPlan(attempt.planId as PlanId)) {
        throw forbiddenError('Invalid payment attempt')
      }

      const expectedAmount = PLAN_PRICES_CENTS[attempt.planId as PlanId]
      if (attempt.amountCents !== expectedAmount) {
        throw forbiddenError('Payment amount does not match the plan catalog')
      }

      const verdict = evaluateSandboxCard(input.cardNumber)

      let payment: PaymentAttemptSummary
      try {
        payment = billing.confirmAttemptInTransaction({
          attemptId: attempt.id,
          userId,
          planId: attempt.planId as PlanId,
          amountCents: attempt.amountCents,
          success: verdict.success,
          failureReason: verdict.reason
        })
      } catch (error) {
        if (error instanceof Error && error.message === 'ATTEMPT_NOT_FOUND') {
          throw notFoundError('Payment attempt not found')
        }
        if (error instanceof Error && error.message === 'ATTEMPT_MISMATCH') {
          throw forbiddenError('Payment attempt is inconsistent')
        }
        throw error
      }

      const subscription = await billing.getSubscription(userId)
      const record = await users.findById(userId)
      if (!record) {
        throw notFoundError('User not found')
      }

      return {
        payment,
        subscription,
        user: await users.toSessionUser(record)
      }
    },

    entitlementsFor(userId: string) {
      return billing.getSubscription(userId).then((sub) => sub.entitlements)
    }
  }
}

/** Pure helper exported for unit tests. */
export function evaluateSandboxCardForTests(cardNumber: string) {
  return evaluateSandboxCard(cardNumber.replace(/\s+/g, ''))
}

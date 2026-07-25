import { and, asc, desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import type { PlanId } from '#shared/constants/billing'
import {
  entitlementsForPlan,
  formatPrice,
  PLAN_DESCRIPTIONS,
  PLAN_ENTITLEMENTS,
  PLAN_FEATURES,
  PLAN_NAMES,
  PLAN_PRICES_CENTS
} from '#shared/constants/billing'
import type {
  BillingPlan,
  PaymentAttemptSummary,
  SubscriptionSummary
} from '#shared/types/api'
import { nowIso } from '#shared/utils/date'
import { useDatabase } from '../database/client'
import { paymentAttempts, plans, subscriptions } from '../database/schema'
import type { PaymentAttemptRecord, PlanRecord, SubscriptionRecord } from '../database/schema'

function parseJsonArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function toBillingPlan(row: PlanRecord): BillingPlan {
  const id = row.id as PlanId
  const features = parseJsonArray(row.featuresJson)
  const entitlements = parseJsonArray(row.entitlementsJson) as BillingPlan['entitlements']

  return {
    id,
    name: row.name || PLAN_NAMES[id],
    description: row.description || PLAN_DESCRIPTIONS[id],
    priceCents: row.priceCents,
    priceLabel: formatPrice(row.priceCents),
    features: features.length ? features : [...PLAN_FEATURES[id]],
    entitlements: entitlements.length ? entitlements : [...PLAN_ENTITLEMENTS[id]],
    highlighted: id === 'plus'
  }
}

function toPaymentSummary(row: PaymentAttemptRecord): PaymentAttemptSummary {
  return {
    id: row.id,
    planId: row.planId as PlanId,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status as PaymentAttemptSummary['status'],
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    confirmedAt: row.confirmedAt
  }
}

function toSubscriptionSummary(row: SubscriptionRecord | null): SubscriptionSummary {
  const planId = (row?.planId as PlanId | undefined) ?? 'free'
  return {
    planId,
    status: (row?.status as SubscriptionSummary['status']) ?? 'active',
    entitlements: entitlementsForPlan(planId),
    currentPeriodEnd: row?.currentPeriodEnd ?? null,
    updatedAt: row?.updatedAt ?? nowIso()
  }
}

export function createBillingRepository() {
  const { db, sqlite } = useDatabase()

  return {
    async listPlans(): Promise<BillingPlan[]> {
      const rows = await db
        .select()
        .from(plans)
        .where(eq(plans.active, true))
        .orderBy(asc(plans.sortOrder))

      if (!rows.length) {
        return (['free', 'plus', 'pro'] as const).map((id) =>
          toBillingPlan({
            id,
            name: PLAN_NAMES[id],
            description: PLAN_DESCRIPTIONS[id],
            priceCents: PLAN_PRICES_CENTS[id],
            currency: 'usd',
            entitlementsJson: JSON.stringify(PLAN_ENTITLEMENTS[id]),
            featuresJson: JSON.stringify(PLAN_FEATURES[id]),
            active: true,
            sortOrder: 0
          })
        )
      }

      return rows.map(toBillingPlan)
    },

    async getPlan(planId: PlanId): Promise<BillingPlan | null> {
      const [row] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1)
      return row ? toBillingPlan(row) : null
    },

    async getSubscription(userId: string): Promise<SubscriptionSummary> {
      const [row] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)
      return toSubscriptionSummary(row ?? null)
    },

    async ensureFreeSubscription(userId: string): Promise<void> {
      const [existing] = await db
        .select({ id: subscriptions.id })
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .limit(1)

      if (existing) {
        return
      }

      const timestamp = nowIso()
      await db.insert(subscriptions).values({
        id: `sub_${nanoid()}`,
        userId,
        planId: 'free',
        status: 'active',
        currentPeriodEnd: null,
        createdAt: timestamp,
        updatedAt: timestamp
      })
    },

    async findAttemptByIdempotency(
      userId: string,
      idempotencyKey: string
    ): Promise<PaymentAttemptRecord | null> {
      const [row] = await db
        .select()
        .from(paymentAttempts)
        .where(
          and(
            eq(paymentAttempts.userId, userId),
            eq(paymentAttempts.idempotencyKey, idempotencyKey)
          )
        )
        .limit(1)
      return row ?? null
    },

    async findAttemptById(attemptId: string): Promise<PaymentAttemptRecord | null> {
      const [row] = await db
        .select()
        .from(paymentAttempts)
        .where(eq(paymentAttempts.id, attemptId))
        .limit(1)
      return row ?? null
    },

    async createPendingAttempt(input: {
      userId: string
      planId: PlanId
      amountCents: number
      idempotencyKey: string
    }): Promise<PaymentAttemptRecord> {
      const id = `pay_${nanoid()}`
      const timestamp = nowIso()

      await db.insert(paymentAttempts).values({
        id,
        userId: input.userId,
        planId: input.planId,
        amountCents: input.amountCents,
        currency: 'usd',
        status: 'pending',
        idempotencyKey: input.idempotencyKey,
        failureReason: null,
        createdAt: timestamp,
        confirmedAt: null
      })

      const created = await this.findAttemptById(id)
      if (!created) {
        throw new Error('Payment attempt creation failed')
      }
      return created
    },

    /**
     * Atomically finalize a pending attempt and activate the plan on success.
     * Uses a SQLite transaction so a confirmed payment cannot exist without
     * the matching subscription upgrade.
     */
    confirmAttemptInTransaction(input: {
      attemptId: string
      userId: string
      planId: PlanId
      amountCents: number
      success: boolean
      failureReason: string | null
    }): PaymentAttemptSummary {
      const run = sqlite.transaction(() => {
        const attempt = sqlite
          .prepare('SELECT * FROM payment_attempts WHERE id = ? AND user_id = ?')
          .get(input.attemptId, input.userId) as
          | {
              id: string
              user_id: string
              plan_id: string
              amount_cents: number
              currency: string
              status: string
              idempotency_key: string
              failure_reason: string | null
              created_at: string
              confirmed_at: string | null
            }
          | undefined

        if (!attempt) {
          throw new Error('ATTEMPT_NOT_FOUND')
        }

        if (attempt.status !== 'pending') {
          return {
            id: attempt.id,
            planId: attempt.plan_id as PlanId,
            amountCents: attempt.amount_cents,
            currency: attempt.currency,
            status: attempt.status as PaymentAttemptSummary['status'],
            failureReason: attempt.failure_reason,
            createdAt: attempt.created_at,
            confirmedAt: attempt.confirmed_at
          }
        }

        if (attempt.plan_id !== input.planId || attempt.amount_cents !== input.amountCents) {
          throw new Error('ATTEMPT_MISMATCH')
        }

        const timestamp = nowIso()

        if (!input.success) {
          sqlite
            .prepare(
              `UPDATE payment_attempts
               SET status = 'failed', failure_reason = ?, confirmed_at = ?
               WHERE id = ? AND status = 'pending'`
            )
            .run(input.failureReason ?? 'Payment declined', timestamp, input.attemptId)

          return {
            id: attempt.id,
            planId: attempt.plan_id as PlanId,
            amountCents: attempt.amount_cents,
            currency: attempt.currency,
            status: 'failed' as const,
            failureReason: input.failureReason ?? 'Payment declined',
            createdAt: attempt.created_at,
            confirmedAt: timestamp
          }
        }

        const periodEnd = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString()

        sqlite
          .prepare(
            `UPDATE payment_attempts
             SET status = 'confirmed', failure_reason = NULL, confirmed_at = ?
             WHERE id = ? AND status = 'pending'`
          )
          .run(timestamp, input.attemptId)

        const existing = sqlite
          .prepare('SELECT id FROM subscriptions WHERE user_id = ?')
          .get(input.userId) as { id: string } | undefined

        if (existing) {
          sqlite
            .prepare(
              `UPDATE subscriptions
               SET plan_id = ?, status = 'active', current_period_end = ?, updated_at = ?
               WHERE user_id = ?`
            )
            .run(input.planId, periodEnd, timestamp, input.userId)
        } else {
          sqlite
            .prepare(
              `INSERT INTO subscriptions
                (id, user_id, plan_id, status, current_period_end, created_at, updated_at)
               VALUES (?, ?, ?, 'active', ?, ?, ?)`
            )
            .run(`sub_${nanoid()}`, input.userId, input.planId, periodEnd, timestamp, timestamp)
        }

        return {
          id: attempt.id,
          planId: attempt.plan_id as PlanId,
          amountCents: attempt.amount_cents,
          currency: attempt.currency,
          status: 'confirmed' as const,
          failureReason: null,
          createdAt: attempt.created_at,
          confirmedAt: timestamp
        }
      })

      return run()
    },

    async latestAttempts(userId: string, limit = 5): Promise<PaymentAttemptSummary[]> {
      const rows = await db
        .select()
        .from(paymentAttempts)
        .where(eq(paymentAttempts.userId, userId))
        .orderBy(desc(paymentAttempts.createdAt))
        .limit(limit)
      return rows.map(toPaymentSummary)
    },

    toPaymentSummary
  }
}

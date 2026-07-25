import { z } from 'zod'
import { PLAN_IDS } from '#shared/constants/billing'

export const planIdSchema = z.enum(PLAN_IDS)

export const checkoutSchema = z.object({
  planId: planIdSchema.refine((id) => id !== 'free', {
    message: 'Choose Plus or Pro to start checkout'
  }),
  /** Client-generated key so retries do not create duplicate attempts. */
  idempotencyKey: z.string().min(8).max(128)
})

export type CheckoutInput = z.infer<typeof checkoutSchema>

/**
 * Sandbox card fields. Digits only — never persist. Outcome is deterministic
 * from the card number (4242… succeeds, 4000…0002 declines).
 */
export const confirmPaymentSchema = z.object({
  attemptId: z.string().min(1).max(64),
  cardNumber: z
    .string()
    .transform((value) => value.replace(/\s+/g, ''))
    .pipe(z.string().regex(/^\d{13,19}$/, 'Enter a valid card number')),
  cardExpiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY'),
  cardCvc: z.string().regex(/^\d{3,4}$/, 'Enter a valid CVC')
})

export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>

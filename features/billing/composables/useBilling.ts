import { computed, ref } from 'vue'
import type { PlanId } from '#shared/constants/billing'
import type {
  BillingPlan,
  PaymentAttemptSummary,
  SessionUser,
  SubscriptionSummary
} from '#shared/types/api'
import { extractApiErrorMessage } from '#shared/utils/apiError'
import { useAppToast } from '#shared/composables/useAppToast'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

function makeIdempotencyKey(planId: string): string {
  const random
    = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2)}`
  return `checkout_${planId}_${random}`
}

/**
 * Billing orchestration: catalog, checkout, confirm, and session refresh.
 */
export function useBilling() {
  const { $api } = useNuxtApp()
  const toast = useAppToast()
  const auth = useAuthStore()

  const plans = ref<BillingPlan[]>([])
  const subscription = ref<SubscriptionSummary | null>(null)
  const pendingPayment = ref<PaymentAttemptSummary | null>(null)
  const loading = ref(false)
  const confirming = ref(false)
  const lastError = ref<string | null>(null)

  const currentPlanId = computed<PlanId>(() => auth.user?.planId ?? 'free')
  const entitlements = computed(() => auth.user?.entitlements ?? [])

  function hasEntitlement(entitlement: string): boolean {
    return entitlements.value.includes(entitlement as never)
  }

  async function fetchPlans(): Promise<void> {
    const result = await $api<{ plans: BillingPlan[] }>('/api/billing/plans')
    plans.value = result.plans
  }

  async function fetchSubscription(): Promise<void> {
    const result = await $api<{
      subscription: SubscriptionSummary
      user: SessionUser
    }>('/api/billing/subscription')
    subscription.value = result.subscription
    auth.user = result.user
  }

  async function startCheckout(planId: Exclude<PlanId, 'free'>): Promise<PaymentAttemptSummary | null> {
    loading.value = true
    lastError.value = null
    try {
      const result = await $api<{ payment: PaymentAttemptSummary }>('/api/billing/checkout', {
        method: 'POST',
        body: {
          planId,
          idempotencyKey: makeIdempotencyKey(planId)
        }
      })
      pendingPayment.value = result.payment
      return result.payment
    } catch (error) {
      lastError.value = extractApiErrorMessage(error)
      toast.error('Checkout failed', lastError.value)
      return null
    } finally {
      loading.value = false
    }
  }

  async function confirmPayment(input: {
    attemptId: string
    cardNumber: string
    cardExpiry: string
    cardCvc: string
  }): Promise<boolean> {
    confirming.value = true
    lastError.value = null
    try {
      const result = await $api<{
        payment: PaymentAttemptSummary
        subscription: SubscriptionSummary
        user: SessionUser
      }>('/api/billing/confirm', {
        method: 'POST',
        body: input
      })

      pendingPayment.value = result.payment
      subscription.value = result.subscription
      auth.user = result.user

      if (result.payment.status === 'confirmed') {
        toast.success('Payment confirmed', `You’re now on ${result.subscription.planId}.`)
        return true
      }

      lastError.value = result.payment.failureReason ?? 'Payment was not confirmed'
      toast.error('Payment failed', lastError.value)
      return false
    } catch (error) {
      lastError.value = extractApiErrorMessage(error)
      toast.error('Payment failed', lastError.value)
      return false
    } finally {
      confirming.value = false
    }
  }

  return {
    plans,
    subscription,
    pendingPayment,
    loading,
    confirming,
    lastError,
    currentPlanId,
    entitlements,
    hasEntitlement,
    fetchPlans,
    fetchSubscription,
    startCheckout,
    confirmPayment
  }
}

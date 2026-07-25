<script setup lang="ts">
import type { PlanId } from '#shared/constants/billing'
import type { BillingPlan } from '#shared/types/api'
import { useAuth } from '#features/auth/composables/useAuth'
import { useBilling } from '#features/billing/composables/useBilling'

const { isAuthenticated } = useAuth()
const {
  plans,
  pendingPayment,
  confirming,
  lastError,
  currentPlanId,
  fetchPlans,
  startCheckout,
  confirmPayment
} = useBilling()

const checkoutOpen = ref(false)

onMounted(async () => {
  await fetchPlans()
})

async function onSelect(planId: Exclude<PlanId, 'free'>) {
  if (!isAuthenticated.value) {
    await navigateTo(`/register?redirect=${encodeURIComponent('/settings')}`)
    return
  }
  const payment = await startCheckout(planId)
  if (payment) {
    checkoutOpen.value = true
  }
}

async function onConfirm(payload: {
  cardNumber: string
  cardExpiry: string
  cardCvc: string
}) {
  if (!pendingPayment.value) {
    return
  }
  const ok = await confirmPayment({
    attemptId: pendingPayment.value.id,
    ...payload
  })
  if (ok) {
    checkoutOpen.value = false
    await navigateTo('/analytics')
  }
}

const displayPlans = computed<BillingPlan[]>(() => plans.value)
</script>

<template>
  <div
    class="space-y-6"
    data-testid="landing-pricing"
  >
    <PricingCards
      :plans="displayPlans"
      :current-plan-id="isAuthenticated ? currentPlanId : 'free'"
      @select="onSelect"
    />

    <p class="text-center text-xs text-muted">
      Sandbox checkout only — use card 4242 4242 4242 4242 to confirm, or 4000 0000 0000 0002 to decline.
      Premium Focus Orbit unlocks only after payment is confirmed.
    </p>

    <SandboxCheckoutModal
      v-model:open="checkoutOpen"
      :payment="pendingPayment"
      :confirming="confirming"
      :error="lastError"
      @confirm="onConfirm"
    />
  </div>
</template>

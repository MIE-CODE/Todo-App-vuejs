<script setup lang="ts">
import type { PlanId } from '#shared/constants/billing'
import { useBilling } from '#features/billing/composables/useBilling'

withDefaults(
  defineProps<{
    upgradeOnly?: boolean
    heading?: string
    subheading?: string
  }>(),
  {
    upgradeOnly: false,
    heading: 'Choose your plan',
    subheading: 'Sandbox payments unlock premium Focus Orbit features instantly after confirmation.'
  }
)

const {
  plans,
  pendingPayment,
  loading,
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
  }
}

defineExpose({
  openCheckout: onSelect
})
</script>

<template>
  <div
    class="space-y-6"
    data-testid="billing-panel"
  >
    <div
      v-if="heading"
      class="space-y-2 text-center"
    >
      <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">
        {{ heading }}
      </h2>
      <p class="mx-auto max-w-2xl text-muted">
        {{ subheading }}
      </p>
    </div>

    <PricingCards
      :plans="plans"
      :current-plan-id="currentPlanId"
      :upgrade-only="upgradeOnly"
      @select="onSelect"
    />

    <p
      v-if="loading"
      class="text-center text-sm text-muted"
    >
      Preparing checkout…
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

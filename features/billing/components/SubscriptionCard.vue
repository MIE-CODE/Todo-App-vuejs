<script setup lang="ts">
import type { PlanId } from '#shared/constants/billing'
import { PLAN_NAMES, formatPrice, PLAN_PRICES_CENTS } from '#shared/constants/billing'
import type { SubscriptionSummary } from '#shared/types/api'
import { useBilling } from '#features/billing/composables/useBilling'

const props = defineProps<{
  subscription: SubscriptionSummary | null
}>()

const emit = defineEmits<{
  upgrade: [planId: Exclude<PlanId, 'free'>]
}>()

const { fetchPlans, plans } = useBilling()

onMounted(async () => {
  if (!plans.value.length) {
    await fetchPlans()
  }
})

const planId = computed(() => props.subscription?.planId ?? 'free')
const periodEnd = computed(() => {
  if (!props.subscription?.currentPeriodEnd) {
    return null
  }
  return new Date(props.subscription.currentPeriodEnd).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
})
</script>

<template>
  <UCard data-testid="subscription-card">
    <template #header>
      <div class="flex items-center justify-between gap-3">
        <h2 class="font-semibold">
          Subscription
        </h2>
        <UBadge
          :color="planId === 'free' ? 'neutral' : 'primary'"
          variant="subtle"
          data-testid="current-plan-badge"
        >
          {{ PLAN_NAMES[planId] }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <p class="text-sm text-muted">
        <template v-if="planId === 'free'">
          You’re on Free. Upgrade to unlock Focus Orbit and premium planning tools.
        </template>
        <template v-else>
          Active {{ PLAN_NAMES[planId] }} plan
          ({{ formatPrice(PLAN_PRICES_CENTS[planId]) }}/mo)
          <span v-if="periodEnd"> · renews {{ periodEnd }}</span>.
          Premium features unlock only after sandbox payment is confirmed.
        </template>
      </p>

      <ul
        v-if="subscription?.entitlements?.length"
        class="flex flex-wrap gap-2"
      >
        <UBadge
          v-for="entitlement in subscription.entitlements"
          :key="entitlement"
          color="neutral"
          variant="soft"
          size="sm"
        >
          {{ entitlement.replaceAll('_', ' ') }}
        </UBadge>
      </ul>

      <div class="flex flex-wrap gap-2">
        <UButton
          v-if="planId !== 'plus'"
          color="primary"
          variant="soft"
          data-testid="upgrade-plus"
          @click="emit('upgrade', 'plus')"
        >
          {{ planId === 'pro' ? 'Switch to Plus' : 'Upgrade to Plus' }}
        </UButton>
        <UButton
          v-if="planId !== 'pro'"
          color="primary"
          data-testid="upgrade-pro"
          @click="emit('upgrade', 'pro')"
        >
          Upgrade to Pro
        </UButton>
      </div>
    </div>
  </UCard>
</template>

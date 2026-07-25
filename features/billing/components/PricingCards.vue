<script setup lang="ts">
import type { BillingPlan } from '#shared/types/api'
import type { PlanId } from '#shared/constants/billing'
import { formatPrice } from '#shared/constants/billing'

const props = defineProps<{
  plans: BillingPlan[]
  currentPlanId: PlanId
  /** When true, hide Free as a CTA target. */
  upgradeOnly?: boolean
}>()

const emit = defineEmits<{
  select: [planId: Exclude<PlanId, 'free'>]
}>()

const visiblePlans = computed(() =>
  props.upgradeOnly ? props.plans.filter((plan) => plan.id !== 'free') : props.plans
)

function ctaLabel(plan: BillingPlan): string {
  if (plan.id === props.currentPlanId) {
    return 'Current plan'
  }
  if (plan.id === 'free') {
    return 'Included'
  }
  const order = { free: 0, plus: 1, pro: 2 }
  return order[plan.id] > order[props.currentPlanId] ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`
}

function canCheckout(plan: BillingPlan): boolean {
  return plan.id !== 'free' && plan.id !== props.currentPlanId
}
</script>

<template>
  <div
    class="grid gap-4 md:grid-cols-3"
    data-testid="pricing-cards"
  >
    <UCard
      v-for="plan in visiblePlans"
      :key="plan.id"
      class="relative flex h-full flex-col"
      :class="plan.highlighted ? 'ring-1 ring-primary/40' : ''"
      :data-testid="`plan-card-${plan.id}`"
    >
      <UBadge
        v-if="plan.highlighted"
        color="primary"
        variant="subtle"
        class="absolute right-4 top-4"
      >
        Popular
      </UBadge>

      <div class="space-y-4">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold">
            {{ plan.name }}
          </h3>
          <p class="text-sm text-muted">
            {{ plan.description }}
          </p>
        </div>

        <p class="text-3xl font-bold tracking-tight">
          {{ plan.priceLabel || formatPrice(plan.priceCents) }}
          <span
            v-if="plan.priceCents > 0"
            class="text-sm font-normal text-muted"
          >/mo</span>
        </p>

        <ul class="space-y-2 text-sm">
          <li
            v-for="feature in plan.features"
            :key="feature"
            class="flex items-start gap-2"
          >
            <UIcon
              name="i-lucide-check"
              class="mt-0.5 size-4 shrink-0 text-primary"
            />
            <span>{{ feature }}</span>
          </li>
        </ul>

        <UButton
          block
          :color="plan.highlighted ? 'primary' : 'neutral'"
          :variant="canCheckout(plan) ? 'solid' : 'soft'"
          :disabled="!canCheckout(plan)"
          :data-testid="`plan-cta-${plan.id}`"
          @click="canCheckout(plan) && emit('select', plan.id as Exclude<PlanId, 'free'>)"
        >
          {{ ctaLabel(plan) }}
        </UButton>
      </div>
    </UCard>
  </div>
</template>

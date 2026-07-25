<script setup lang="ts">
import { useAuth } from '#features/auth/composables/useAuth'
import { useBilling } from '#features/billing/composables/useBilling'
import { useFocusOrbit } from '#features/focus-orbit/composables/useFocusOrbit'
import type { PlanId } from '#shared/constants/billing'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Focus Orbit · TaskFlow' })

const { user } = useAuth()
const {
  data,
  pending,
  error,
  refreshOrbit,
  capacityHours,
  unlocked,
  errorMessage
} = useFocusOrbit()

const {
  pendingPayment,
  confirming,
  lastError,
  startCheckout,
  confirmPayment
} = useBilling()

const checkoutOpen = ref(false)

async function onUpgrade(planId: Exclude<PlanId, 'free'>) {
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
    await refreshOrbit()
  }
}

watch(capacityHours, async () => {
  if (unlocked.value) {
    await refreshOrbit()
  }
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm font-medium text-primary">
          Premium planning
        </p>
        <h1 class="text-2xl font-semibold">
          Focus Orbit
        </h1>
        <p class="text-muted">
          Visualize due-date gravity, focus sessions, and capacity risk.
        </p>
      </div>
      <UBadge
        :color="unlocked ? 'primary' : 'neutral'"
        variant="subtle"
        data-testid="orbit-plan-badge"
      >
        {{ user?.planId ?? 'free' }} plan
      </UBadge>
    </div>

    <FocusOrbitLocked
      v-if="!unlocked"
      :current-plan-id="user?.planId ?? 'free'"
      @upgrade="onUpgrade"
    />

    <template v-else>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        title="Could not load Focus Orbit"
        :description="errorMessage ?? error.message"
        :actions="[{ label: 'Retry', onClick: () => refreshOrbit() }]"
      />

      <AppSkeletonList
        v-else-if="pending && !data"
        :rows="4"
      />

      <template v-else-if="data">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open on orbit"
            :value="data.summary.openTasks"
            icon="i-lucide-orbit"
            color="primary"
          />
          <StatCard
            label="Due soon"
            :value="data.summary.dueSoon"
            icon="i-lucide-radar"
            color="warning"
          />
          <StatCard
            label="Critical"
            :value="data.summary.critical"
            icon="i-lucide-flame"
            color="error"
          />
          <StatCard
            label="Focus score"
            :value="data.summary.focusScore"
            icon="i-lucide-sparkles"
            color="success"
          />
        </div>

        <div class="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
          <OrbitVisualization
            :nodes="data.nodes"
            :focus-score="data.summary.focusScore"
          />
          <div class="space-y-3 text-sm text-muted">
            <p>
              Nodes closer to the rim are due sooner or higher risk. Color marks calm,
              watch, and critical bands.
            </p>
            <ul class="space-y-2">
              <li
                v-for="node in data.nodes.slice(0, 5)"
                :key="node.id"
                class="flex items-center justify-between gap-3 rounded-xl border border-default px-3 py-2"
              >
                <span class="truncate font-medium text-default">{{ node.title }}</span>
                <UBadge
                  size="sm"
                  :color="node.risk === 'critical' ? 'error' : node.risk === 'watch' ? 'warning' : 'success'"
                  variant="subtle"
                >
                  {{ node.risk }}
                </UBadge>
              </li>
            </ul>
          </div>
        </div>

        <OrbitPlusPanels
          :sessions="data.sessions"
          :workload="data.workload"
        />

        <OrbitProPanels
          v-if="user?.planId === 'pro' || data.forecast || data.recommendations || data.whatIf"
          :forecast="data.forecast"
          :recommendations="data.recommendations"
          :what-if="data.whatIf"
          :capacity-hours="capacityHours"
          @update:capacity-hours="capacityHours = $event"
        />

        <UCard
          v-else
          data-testid="pro-upsell"
        >
          <div class="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h3 class="font-semibold">
                Want forecasting and what-if controls?
              </h3>
              <p class="text-sm text-muted">
                Pro adds risk projections, next-best actions, and capacity simulation.
              </p>
            </div>
            <UButton
              data-testid="upsell-pro"
              @click="onUpgrade('pro')"
            >
              Upgrade to Pro
            </UButton>
          </div>
        </UCard>
      </template>
    </template>

    <SandboxCheckoutModal
      v-model:open="checkoutOpen"
      :payment="pendingPayment"
      :confirming="confirming"
      :error="lastError"
      @confirm="onConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import type { PlanId } from '#shared/constants/billing'

defineProps<{
  currentPlanId: PlanId
}>()

const emit = defineEmits<{
  upgrade: [planId: Exclude<PlanId, 'free'>]
}>()

const previewNodes = [
  { id: 'p1', title: 'Ship landing', priority: 'high' as const, dueDate: null, status: 'todo', angle: 20, radius: 0.8, risk: 'critical' as const },
  { id: 'p2', title: 'Review PRs', priority: 'medium' as const, dueDate: null, status: 'todo', angle: 80, radius: 0.55, risk: 'watch' as const },
  { id: 'p3', title: 'Write brief', priority: 'low' as const, dueDate: null, status: 'todo', angle: 150, radius: 0.4, risk: 'calm' as const },
  { id: 'p4', title: 'Pay invoices', priority: 'urgent' as const, dueDate: null, status: 'todo', angle: 220, radius: 0.9, risk: 'critical' as const },
  { id: 'p5', title: 'Plan sprint', priority: 'medium' as const, dueDate: null, status: 'todo', angle: 300, radius: 0.6, risk: 'watch' as const }
]
</script>

<template>
  <div
    class="space-y-8"
    data-testid="focus-orbit-locked"
  >
    <div class="relative overflow-hidden rounded-3xl border border-default">
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
      <div class="grid items-center gap-8 p-6 lg:grid-cols-2 lg:p-10">
        <div class="space-y-4">
          <UBadge
            color="primary"
            variant="subtle"
          >
            Premium
          </UBadge>
          <h2 class="text-3xl font-semibold tracking-tight">
            Focus Orbit
          </h2>
          <p class="text-muted">
            An animated workload ring that maps due dates, risk, and focus sessions —
            unlocked only after sandbox payment is confirmed.
          </p>
          <ul class="space-y-2 text-sm">
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-sparkles"
                class="size-4 text-primary"
              />
              Plus: orbit timeline, sessions, workload map
            </li>
            <li class="flex items-center gap-2">
              <UIcon
                name="i-lucide-radar"
                class="size-4 text-primary"
              />
              Pro: risk forecast, recommendations, what-if capacity
            </li>
          </ul>
          <div class="flex flex-wrap gap-2 pt-2">
            <UButton
              data-testid="locked-upgrade-plus"
              @click="emit('upgrade', 'plus')"
            >
              Unlock Plus
            </UButton>
            <UButton
              color="neutral"
              variant="soft"
              data-testid="locked-upgrade-pro"
              @click="emit('upgrade', 'pro')"
            >
              Unlock Pro
            </UButton>
          </div>
          <p class="text-xs text-muted">
            Current plan: {{ currentPlanId }}
          </p>
        </div>

        <div class="relative">
          <OrbitVisualization
            :nodes="previewNodes"
            :focus-score="72"
            preview
          />
          <div class="pointer-events-none absolute inset-0 rounded-3xl bg-default/40 backdrop-blur-[1px]" />
        </div>
      </div>
    </div>
  </div>
</template>

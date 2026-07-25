<script setup lang="ts">
import type { OrbitNode } from '#features/focus-orbit/types'

defineProps<{
  nodes: OrbitNode[]
  focusScore: number
  preview?: boolean
}>()

const riskColor: Record<OrbitNode['risk'], string> = {
  calm: 'bg-emerald-400',
  watch: 'bg-amber-400',
  critical: 'bg-rose-500'
}
</script>

<template>
  <div
    class="orbit relative mx-auto aspect-square w-full max-w-md"
    :class="{ 'orbit--preview': preview }"
    data-testid="focus-orbit-ring"
  >
    <div class="orbit-glow pointer-events-none absolute inset-6 rounded-full opacity-60 blur-2xl" />
    <div class="orbit-ring orbit-ring--outer absolute inset-4 rounded-full border border-primary/20" />
    <div class="orbit-ring orbit-ring--mid absolute inset-[18%] rounded-full border border-dashed border-primary/30" />
    <div class="orbit-ring orbit-ring--inner absolute inset-[34%] rounded-full border border-primary/25" />

    <div class="absolute inset-0 flex items-center justify-center">
      <div class="orbit-core rounded-full border border-primary/40 bg-primary/10 px-5 py-4 text-center shadow-sm">
        <p class="text-xs uppercase tracking-wider text-muted">
          Focus
        </p>
        <p
          class="text-3xl font-bold tabular-nums text-primary"
          data-testid="focus-score"
        >
          {{ focusScore }}
        </p>
      </div>
    </div>

    <div
      v-for="(node, index) in nodes"
      :key="node.id"
      class="orbit-node absolute left-1/2 top-1/2"
      :style="{
        '--angle': `${node.angle}deg`,
        '--radius': `${28 + node.radius * 34}%`,
        animationDelay: `${index * 60}ms`
      }"
      :title="node.title"
    >
      <span
        class="orbit-dot block size-3 rounded-full ring-2 ring-default"
        :class="riskColor[node.risk]"
      />
    </div>

    <p
      v-if="!nodes.length"
      class="absolute inset-x-8 bottom-8 text-center text-sm text-muted"
    >
      Capture tasks with due dates to populate your orbit.
    </p>
  </div>
</template>

<style scoped>
.orbit-glow {
  background: radial-gradient(
    circle,
    color-mix(in oklab, var(--ui-primary) 35%, transparent),
    transparent 70%
  );
}

.orbit-ring--outer {
  animation: orbit-spin 48s linear infinite;
}

.orbit-ring--mid {
  animation: orbit-spin 36s linear infinite reverse;
}

.orbit-node {
  transform: rotate(var(--angle)) translateY(calc(-1 * var(--radius))) rotate(calc(-1 * var(--angle)));
  animation: orbit-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.orbit-dot {
  box-shadow: 0 0 12px color-mix(in oklab, currentColor 35%, transparent);
}

.orbit--preview .orbit-ring--outer,
.orbit--preview .orbit-ring--mid {
  animation-duration: 20s;
}

@keyframes orbit-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes orbit-pop {
  from {
    opacity: 0;
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--radius) + 12px))
      rotate(calc(-1 * var(--angle))) scale(0.4);
  }

  to {
    opacity: 1;
    transform: rotate(var(--angle)) translateY(calc(-1 * var(--radius)))
      rotate(calc(-1 * var(--angle))) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-ring--outer,
  .orbit-ring--mid,
  .orbit-node {
    animation: none !important;
  }
}
</style>

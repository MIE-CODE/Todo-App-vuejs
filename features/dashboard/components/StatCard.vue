<script setup lang="ts">
defineProps<{
  label: string
  value: string | number
  icon: string
  hint?: string
  color?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
}>()

const colorClasses: Record<string, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-muted text-muted'
}
</script>

<template>
  <UCard>
    <div class="flex items-center gap-4">
      <span
        class="flex size-11 items-center justify-center rounded-xl"
        :class="colorClasses[color ?? 'primary']"
      >
        <UIcon
          :name="icon"
          class="size-5"
        />
      </span>
      <div class="min-w-0">
        <p class="text-sm text-muted">
          {{ label }}
        </p>
        <p class="text-2xl font-semibold tabular-nums">
          {{ value }}
        </p>
        <p
          v-if="hint"
          class="truncate text-xs text-muted"
        >
          {{ hint }}
        </p>
      </div>
    </div>
  </UCard>
</template>

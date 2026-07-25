<script setup lang="ts">
/**
 * Skeleton loader for list pages.
 * Separating loading UI keeps pages readable and reusable.
 */
defineProps<{
  rows?: number
}>()
</script>

<template>
  <div
    class="space-y-3"
    role="status"
    aria-live="polite"
    aria-label="Loading content"
  >
    <USkeleton
      v-for="row in rows ?? 5"
      :key="row"
      class="h-16 w-full rounded-lg"
    />
    <span class="sr-only">Loading…</span>
  </div>
</template>

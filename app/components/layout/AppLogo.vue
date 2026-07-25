<script setup lang="ts">
withDefaults(defineProps<{ to?: string }>(), { to: '/' })
</script>

<template>
  <NuxtLink
    :to="to"
    class="flex items-center gap-2 font-semibold tracking-tight"
  >
    <span class="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
      <UIcon
        name="i-lucide-check-check"
        class="size-5"
      />
    </span>
    <span class="text-lg">TaskFlow</span>
  </NuxtLink>
</template>

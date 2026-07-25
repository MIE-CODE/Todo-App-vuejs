<script setup lang="ts">
const { isDark, toggle } = useTheme()
</script>

<template>
  <div class="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
    <UButton
      :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
      color="neutral"
      variant="ghost"
      class="absolute right-4 top-4"
      :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      @click="toggle"
    />

    <div class="w-full max-w-md">
      <div class="mb-8 flex justify-center">
        <AppLogo />
      </div>
      <slot />
    </div>
  </div>
</template>

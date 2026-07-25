<script setup lang="ts">
import { useAuth } from '#features/auth/composables/useAuth'

const { isDark, toggle } = useTheme()
const { isAuthenticated } = useAuth()
</script>

<template>
  <div class="min-h-screen bg-default text-default">
    <header class="border-b border-default">
      <div class="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <AppLogo />
        <div class="flex items-center gap-2">
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggle"
          />
          <UButton
            v-if="isAuthenticated"
            to="/dashboard"
            color="primary"
          >
            Open app
          </UButton>
          <template v-else>
            <UButton
              to="/login"
              color="neutral"
              variant="ghost"
            >
              Sign in
            </UButton>
            <UButton
              to="/register"
              color="primary"
            >
              Get started
            </UButton>
          </template>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <slot />
    </main>

    <footer class="border-t border-default">
      <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:px-6">
        <p>© {{ new Date().getFullYear() }} TaskFlow</p>
        <p>Built with Nuxt 4 · self-contained, no external APIs</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth } from '#features/auth/composables/useAuth'

const route = useRoute()
const { isDark, toggle } = useTheme()
const { user } = useAuth()

const links = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard', premium: false },
  { label: 'Tasks', to: '/tasks', icon: 'i-lucide-list-checks', premium: false },
  { label: 'Calendar', to: '/calendar', icon: 'i-lucide-calendar-days', premium: false },
  { label: 'Focus Orbit', to: '/analytics', icon: 'i-lucide-orbit', premium: true }
]

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const currentTitle = computed(() => links.find((link) => isActive(link.to))?.label ?? 'TaskFlow')

const planId = computed(() => user.value?.planId ?? 'free')
</script>

<template>
  <div class="flex min-h-screen flex-col bg-default text-default lg:h-dvh lg:grid lg:grid-cols-[260px_1fr] lg:overflow-hidden">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
    >
      Skip to content
    </a>

    <aside class="hidden border-r border-default px-4 py-5 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
      <AppLogo class="mb-8 shrink-0 px-2" />

      <nav
        class="min-h-0 flex-1 space-y-1 overflow-y-auto"
        aria-label="Primary"
      >
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          :variant="isActive(link.to) ? 'soft' : 'ghost'"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
          block
          class="justify-start"
        >
          <span class="flex w-full items-center justify-between gap-2">
            <span>{{ link.label }}</span>
            <UBadge
              v-if="link.premium && planId === 'free'"
              size="sm"
              color="primary"
              variant="subtle"
            >
              Pro
            </UBadge>
          </span>
        </UButton>
      </nav>

      <UButton
        to="/settings"
        icon="i-lucide-settings"
        :variant="isActive('/settings') ? 'soft' : 'ghost'"
        :color="isActive('/settings') ? 'primary' : 'neutral'"
        block
        class="mt-4 shrink-0 justify-start"
      >
        Settings
      </UButton>
    </aside>

    <div class="flex min-h-0 min-w-0 flex-1 flex-col">
      <header
        class="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-default bg-default/80 px-4 py-3 backdrop-blur sm:px-6"
      >
        <div class="flex items-center gap-3">
          <AppLogo class="lg:hidden" />
          <h1 class="hidden text-lg font-semibold lg:block">
            {{ currentTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
          <UBadge
            v-if="planId !== 'free'"
            color="primary"
            variant="subtle"
            class="hidden sm:inline-flex"
            data-testid="nav-plan-badge"
          >
            {{ planId }}
          </UBadge>
          <UButton
            :icon="isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
            color="neutral"
            variant="ghost"
            :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
            @click="toggle"
          />
          <UserMenu />
        </div>
      </header>

      <!-- Mobile navigation -->
      <nav
        class="flex shrink-0 gap-1 overflow-x-auto border-b border-default px-2 py-2 lg:hidden"
        aria-label="Primary mobile"
      >
        <UButton
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          :icon="link.icon"
          size="sm"
          :variant="isActive(link.to) ? 'soft' : 'ghost'"
          :color="isActive(link.to) ? 'primary' : 'neutral'"
        >
          {{ link.label }}
        </UButton>
      </nav>

      <main
        id="main"
        class="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

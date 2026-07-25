<script setup lang="ts">
import { computed } from 'vue'

const route = useRoute()
const { isDark, toggle } = useTheme()

const links = [
  { label: 'Dashboard', to: '/dashboard', icon: 'i-lucide-layout-dashboard' },
  { label: 'Tasks', to: '/tasks', icon: 'i-lucide-list-checks' },
  { label: 'Calendar', to: '/calendar', icon: 'i-lucide-calendar-days' },
  { label: 'Analytics', to: '/analytics', icon: 'i-lucide-bar-chart-3' }
]

const isActive = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`)

const currentTitle = computed(
  () => links.find((link) => isActive(link.to))?.label ?? 'TaskFlow'
)
</script>

<template>
  <div class="min-h-screen bg-default text-default lg:grid lg:grid-cols-[260px_1fr]">
    <a
      href="#main"
      class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-white"
    >
      Skip to content
    </a>

    <aside class="hidden border-r border-default px-4 py-5 lg:flex lg:flex-col">
      <AppLogo class="mb-8 px-2" />

      <nav
        class="flex-1 space-y-1"
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
          {{ link.label }}
        </UButton>
      </nav>

      <UButton
        to="/settings"
        icon="i-lucide-settings"
        :variant="isActive('/settings') ? 'soft' : 'ghost'"
        :color="isActive('/settings') ? 'primary' : 'neutral'"
        block
        class="justify-start"
      >
        Settings
      </UButton>
    </aside>

    <div class="flex min-h-screen flex-col">
      <header
        class="sticky top-0 z-30 flex items-center justify-between border-b border-default bg-default/80 px-4 py-3 backdrop-blur sm:px-6"
      >
        <div class="flex items-center gap-3">
          <AppLogo class="lg:hidden" />
          <h1 class="hidden text-lg font-semibold lg:block">
            {{ currentTitle }}
          </h1>
        </div>

        <div class="flex items-center gap-2">
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
        class="flex gap-1 overflow-x-auto border-b border-default px-2 py-2 lg:hidden"
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
        class="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6"
      >
        <slot />
      </main>
    </div>
  </div>
</template>

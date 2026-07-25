<script setup lang="ts">
import { computed } from 'vue'
import type { DropdownMenuItem } from '@nuxt/ui'
import { useAuth } from '#features/auth/composables/useAuth'

const { user, logout } = useAuth()

const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      label: user.value?.name ?? 'Account',
      type: 'label' as const
    },
    {
      label: `Plan: ${user.value?.planId ?? 'free'}`,
      type: 'label' as const
    }
  ],
  [
    { label: 'Profile', icon: 'i-lucide-user', to: '/profile' },
    { label: 'Settings', icon: 'i-lucide-settings', to: '/settings' },
    { label: 'Focus Orbit', icon: 'i-lucide-orbit', to: '/analytics' }
  ],
  [
    {
      label: 'Sign out',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      onSelect: () => {
        void logout()
      }
    }
  ]
])
</script>

<template>
  <UDropdownMenu
    v-if="user"
    :items="items"
    :content="{ align: 'end' }"
  >
    <button
      type="button"
      class="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label="Open account menu"
    >
      <AppAvatar
        :name="user.name"
        :color="user.avatarColor"
        size="sm"
      />
      <span class="hidden text-sm font-medium sm:inline">{{ user.name }}</span>
      <UIcon
        name="i-lucide-chevron-down"
        class="hidden size-4 text-muted sm:inline"
      />
    </button>
  </UDropdownMenu>
</template>

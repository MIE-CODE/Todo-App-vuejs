<script setup lang="ts">
import { ref, watchEffect } from 'vue'
import { OAUTH_PROVIDERS } from '#shared/constants/app'
import type { OAuthProvider } from '#shared/constants/app'
import { useAuth } from '#features/auth/composables/useAuth'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Profile · TaskFlow' })

const { user, updateProfile } = useAuth()

const name = ref(user.value?.name ?? '')
const pending = ref(false)

watchEffect(() => {
  if (user.value) {
    name.value = user.value.name
  }
})

const providerMeta: Record<OAuthProvider, { label: string; icon: string }> = {
  google: { label: 'Google', icon: 'i-simple-icons-google' },
  github: { label: 'GitHub', icon: 'i-simple-icons-github' }
}

async function onSave() {
  if (!name.value.trim()) {
    return
  }
  pending.value = true
  try {
    await updateProfile({ name: name.value.trim() })
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div
    v-if="user"
    class="mx-auto max-w-2xl space-y-6"
  >
    <h1 class="text-2xl font-semibold">
      Profile
    </h1>

    <UCard>
      <div class="flex items-center gap-4">
        <AppAvatar
          :name="user.name"
          :color="user.avatarColor"
          size="lg"
        />
        <div>
          <p class="text-lg font-semibold">
            {{ user.name }}
          </p>
          <p class="text-sm text-muted">
            {{ user.email }}
          </p>
          <UBadge
            v-if="user.emailVerified"
            color="success"
            variant="subtle"
            size="sm"
            class="mt-1"
          >
            Verified
          </UBadge>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Display name
        </h2>
      </template>
      <form
        class="flex flex-col gap-3 sm:flex-row sm:items-end"
        @submit.prevent="onSave"
      >
        <UFormField
          label="Name"
          name="name"
          class="flex-1"
        >
          <UInput
            v-model="name"
            data-testid="profile-name"
            class="w-full"
          />
        </UFormField>
        <UButton
          type="submit"
          :loading="pending"
          data-testid="profile-save"
        >
          Save
        </UButton>
      </form>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Connected accounts
        </h2>
      </template>
      <ul class="space-y-3">
        <li
          v-for="provider in OAUTH_PROVIDERS"
          :key="provider"
          class="flex items-center justify-between"
        >
          <span class="flex items-center gap-2">
            <UIcon
              :name="providerMeta[provider].icon"
              class="size-5"
            />
            {{ providerMeta[provider].label }}
          </span>
          <UBadge
            :color="user.connectedProviders.includes(provider) ? 'success' : 'neutral'"
            variant="subtle"
          >
            {{ user.connectedProviders.includes(provider) ? 'Connected' : 'Not connected' }}
          </UBadge>
        </li>
      </ul>
    </UCard>
  </div>
</template>

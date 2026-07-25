<script setup lang="ts">
import { ref } from 'vue'
import { OAUTH_PROVIDERS } from '#shared/constants/app'
import type { OAuthProvider } from '#shared/constants/app'
import { useAuth } from '#features/auth/composables/useAuth'

const { loginWithProvider } = useAuth()

const pendingProvider = ref<OAuthProvider | null>(null)

const providerMeta: Record<OAuthProvider, { label: string; icon: string }> = {
  google: { label: 'Continue with Google', icon: 'i-simple-icons-google' },
  github: { label: 'Continue with GitHub', icon: 'i-simple-icons-github' }
}

async function connect(provider: OAuthProvider) {
  pendingProvider.value = provider
  try {
    await loginWithProvider(provider)
  } finally {
    // On success the browser navigates away; reset guards the failure path.
    pendingProvider.value = null
  }
}
</script>

<template>
  <div class="space-y-2">
    <UButton
      v-for="provider in OAUTH_PROVIDERS"
      :key="provider"
      :icon="providerMeta[provider].icon"
      color="neutral"
      variant="outline"
      block
      size="lg"
      :loading="pendingProvider === provider"
      :disabled="pendingProvider !== null"
      @click="connect(provider)"
    >
      {{ providerMeta[provider].label }}
    </UButton>
  </div>
</template>

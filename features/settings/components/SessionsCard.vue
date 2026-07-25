<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { formatDateTime } from '#shared/utils/date'
import { extractApiErrorMessage } from '#shared/utils/apiError'
import { useAppToast } from '#shared/composables/useAppToast'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

const store = useAuthStore()
const toast = useAppToast()

const loading = ref(true)
const revoking = ref(false)

onMounted(async () => {
  try {
    await store.fetchSessions()
  } catch (error) {
    toast.error('Could not load sessions', extractApiErrorMessage(error))
  } finally {
    loading.value = false
  }
})

async function revokeOthers() {
  revoking.value = true
  try {
    const count = await store.revokeOtherSessions()
    toast.success('Other sessions signed out', `${count} session(s) revoked.`)
  } catch (error) {
    toast.error('Could not revoke sessions', extractApiErrorMessage(error))
  } finally {
    revoking.value = false
  }
}

function deviceLabel(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device'
  if (/mobile/i.test(userAgent)) return 'Mobile browser'
  if (/firefox/i.test(userAgent)) return 'Firefox'
  if (/edg/i.test(userAgent)) return 'Edge'
  if (/chrome/i.test(userAgent)) return 'Chrome'
  if (/safari/i.test(userAgent)) return 'Safari'
  return 'Browser'
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="font-semibold">
          Active sessions
        </h2>
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          :loading="revoking"
          :disabled="store.sessions.length <= 1"
          data-testid="revoke-others"
          @click="revokeOthers"
        >
          Sign out other sessions
        </UButton>
      </div>
    </template>

    <AppSkeletonList
      v-if="loading"
      :rows="2"
    />

    <ul
      v-else
      class="divide-y divide-default"
    >
      <li
        v-for="session in store.sessions"
        :key="session.id"
        class="flex items-center justify-between gap-3 py-3"
      >
        <div class="min-w-0">
          <p class="flex items-center gap-2 font-medium">
            {{ deviceLabel(session.userAgent) }}
            <UBadge
              v-if="session.current"
              color="primary"
              variant="subtle"
              size="sm"
            >
              This device
            </UBadge>
          </p>
          <p class="text-xs text-muted">
            Last active {{ formatDateTime(session.lastUsedAt) }}
          </p>
        </div>
      </li>
    </ul>
  </UCard>
</template>

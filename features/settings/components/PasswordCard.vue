<script setup lang="ts">
import { reactive, ref } from 'vue'
import { changePasswordSchema } from '#shared/schemas/auth'
import { useAuth } from '#features/auth/composables/useAuth'

const { user, changePassword } = useAuth()

const form = reactive({ currentPassword: '', newPassword: '' })
const errors = ref<Record<string, string>>({})
const pending = ref(false)

async function onSubmit() {
  errors.value = {}

  const payload = {
    currentPassword: user.value?.hasPassword ? form.currentPassword : undefined,
    newPassword: form.newPassword
  }

  const parsed = changePasswordSchema.safeParse(payload)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]
      if (typeof key === 'string' && !errors.value[key]) {
        errors.value[key] = issue.message
      }
    }
    return
  }

  pending.value = true
  try {
    const ok = await changePassword(parsed.data)
    if (ok) {
      form.currentPassword = ''
      form.newPassword = ''
    }
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="font-semibold">
        {{ user?.hasPassword ? 'Change password' : 'Set a password' }}
      </h2>
    </template>

    <form
      class="space-y-4"
      novalidate
      @submit.prevent="onSubmit"
    >
      <AppTextField
        v-if="user?.hasPassword"
        v-model="form.currentPassword"
        label="Current password"
        name="currentPassword"
        type="password"
        autocomplete="current-password"
        test-id="current-password"
        :error="errors.currentPassword"
      />
      <AppTextField
        v-model="form.newPassword"
        label="New password"
        name="newPassword"
        type="password"
        autocomplete="new-password"
        test-id="new-password"
        :error="errors.newPassword"
        hint="At least 8 characters with upper, lower, and a number."
      />

      <div class="flex justify-end">
        <UButton
          type="submit"
          :loading="pending"
          data-testid="change-password-submit"
        >
          {{ user?.hasPassword ? 'Update password' : 'Set password' }}
        </UButton>
      </div>
    </form>
  </UCard>
</template>

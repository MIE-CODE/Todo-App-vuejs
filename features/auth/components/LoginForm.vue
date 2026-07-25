<script setup lang="ts">
import { reactive, ref } from 'vue'
import { loginSchema } from '#shared/schemas/auth'
import { useAuth } from '#features/auth/composables/useAuth'

const { login } = useAuth()

const form = reactive({ email: '', password: '' })
const errors = ref<Record<string, string>>({})
const pending = ref(false)

async function onSubmit() {
  errors.value = {}
  const parsed = loginSchema.safeParse(form)

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
    await login(parsed.data)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form
    class="space-y-4"
    novalidate
    @submit.prevent="onSubmit"
  >
    <AppTextField
      v-model="form.email"
      label="Email"
      name="email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      test-id="login-email"
      :error="errors.email"
      autofocus
    />
    <AppTextField
      v-model="form.password"
      label="Password"
      name="password"
      type="password"
      autocomplete="current-password"
      placeholder="Your password"
      test-id="login-password"
      :error="errors.password"
    />

    <UButton
      type="submit"
      block
      size="lg"
      :loading="pending"
      data-testid="login-submit"
    >
      Sign in
    </UButton>
  </form>
</template>

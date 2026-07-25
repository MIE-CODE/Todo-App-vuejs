<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { registerSchema } from '#shared/schemas/auth'
import { useAuth } from '#features/auth/composables/useAuth'

const { register } = useAuth()

const form = reactive({ name: '', email: '', password: '' })
const errors = ref<Record<string, string>>({})
const pending = ref(false)

const passwordHint = computed(
  () => 'At least 8 characters with an uppercase, lowercase, and a number.'
)

async function onSubmit() {
  errors.value = {}
  const parsed = registerSchema.safeParse(form)

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
    await register(parsed.data)
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
      v-model="form.name"
      label="Name"
      name="name"
      autocomplete="name"
      placeholder="Ada Lovelace"
      test-id="register-name"
      :error="errors.name"
      autofocus
    />
    <AppTextField
      v-model="form.email"
      label="Email"
      name="email"
      type="email"
      autocomplete="email"
      placeholder="you@example.com"
      test-id="register-email"
      :error="errors.email"
    />
    <AppTextField
      v-model="form.password"
      label="Password"
      name="password"
      type="password"
      autocomplete="new-password"
      placeholder="Create a password"
      test-id="register-password"
      :error="errors.password"
      :hint="passwordHint"
    />

    <UButton
      type="submit"
      block
      size="lg"
      :loading="pending"
      data-testid="register-submit"
    >
      Create account
    </UButton>
  </form>
</template>

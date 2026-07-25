<script setup lang="ts">
/**
 * Controlled text field using defineModel.
 * Parent owns the value; this stays a dumb/presentational input.
 */
const model = defineModel<string>({ required: true })

defineProps<{
  label: string
  name: string
  type?: 'text' | 'search' | 'email' | 'password'
  placeholder?: string
  error?: string
  hint?: string
  disabled?: boolean
  autofocus?: boolean
  autocomplete?: string
  testId?: string
}>()
</script>

<template>
  <UFormField
    :label="label"
    :name="name"
    :error="error"
    :help="hint"
  >
    <UInput
      v-model="model"
      :type="type ?? 'text'"
      :placeholder="placeholder"
      :disabled="disabled"
      :autofocus="autofocus"
      :autocomplete="autocomplete"
      :data-testid="testId"
      class="w-full"
    />
  </UFormField>
</template>

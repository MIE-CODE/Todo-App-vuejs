<script setup lang="ts">
import { computed } from 'vue'

/**
 * Time-of-day picker with an `HH:mm` model (empty string = no time).
 * Wraps a native `type="time"` input so keyboard, locale, and 12/24h
 * formatting come for free, styled to match the other form controls.
 */
const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    testId?: string
    ariaLabel?: string
    placeholder?: string
  }>(),
  {
    disabled: false,
    placeholder: 'Set a time'
  }
)

const hasValue = computed(() => Boolean(model.value))

function onInput(event: Event) {
  model.value = (event.target as HTMLInputElement).value
}

function clearTime() {
  if (props.disabled) {
    return
  }
  model.value = ''
}
</script>

<template>
  <div class="flex w-full gap-1">
    <div
      class="flex min-w-0 flex-1 items-center gap-2 rounded-md border border-default bg-default px-3 py-2 text-sm transition-colors focus-within:ring-2 focus-within:ring-primary"
      :class="disabled ? 'cursor-not-allowed opacity-60' : 'hover:bg-muted/40'"
    >
      <UIcon
        name="i-lucide-clock"
        class="size-4 shrink-0 text-muted"
      />
      <input
        :value="model"
        type="time"
        class="min-w-0 flex-1 bg-transparent text-sm outline-none disabled:cursor-not-allowed"
        :class="hasValue ? 'text-default' : 'text-muted'"
        :disabled="disabled"
        :aria-label="ariaLabel ?? 'Choose time'"
        :data-testid="testId"
        @input="onInput"
      >
    </div>
    <button
      v-if="hasValue"
      type="button"
      class="rounded-md border border-default px-2 text-muted hover:bg-muted/40 hover:text-default disabled:cursor-not-allowed"
      aria-label="Clear time"
      :disabled="disabled"
      @click="clearTime"
    >
      <UIcon
        name="i-lucide-x"
        class="size-4"
      />
    </button>
  </div>
</template>

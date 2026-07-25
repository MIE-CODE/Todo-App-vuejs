<script setup lang="ts">
import { computed } from 'vue'
import { getInitials } from '#shared/utils/user'

const props = withDefaults(
  defineProps<{
    name: string
    color?: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { color: '#6366f1', size: 'md' }
)

const initials = computed(() => getInitials(props.name))

const sizeClass = computed(
  () =>
    ({
      sm: 'size-7 text-xs',
      md: 'size-9 text-sm',
      lg: 'size-16 text-xl'
    })[props.size]
)
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
    :class="sizeClass"
    :style="{ backgroundColor: color }"
    :aria-label="name"
    role="img"
  >
    {{ initials }}
  </span>
</template>

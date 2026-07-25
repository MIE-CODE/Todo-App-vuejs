<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onClickOutside, useEventListener } from '@vueuse/core'

/**
 * Primitive-valued select (never {label,value} objects).
 * Designed for form + E2E reliability: model is always a string.
 */
export interface AppSelectOption {
  label: string
  value: string
  disabled?: boolean
}

const model = defineModel<string>({ required: true })

const props = withDefaults(
  defineProps<{
    options: AppSelectOption[]
    placeholder?: string
    disabled?: boolean
    testId?: string
    ariaLabel?: string
  }>(),
  {
    placeholder: 'Select…',
    disabled: false
  }
)

const open = ref(false)
const highlightIndex = ref(-1)
const rootRef = ref<HTMLElement | null>(null)
const listRef = ref<HTMLElement | null>(null)

const { panelStyle } = useFloatingPanel(rootRef, open, {
  maxHeight: 240,
  zIndex: 200
})

const selectedOption = computed(
  () => props.options.find(option => option.value === model.value) ?? null
)

const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder)

function close() {
  open.value = false
  highlightIndex.value = -1
}

function openList() {
  if (props.disabled) {
    return
  }
  open.value = true
  const current = props.options.findIndex(option => option.value === model.value)
  highlightIndex.value = current >= 0 ? current : 0
  void nextTick(() => {
    listRef.value?.focus()
  })
}

function toggle() {
  if (open.value) {
    close()
  } else {
    openList()
  }
}

function selectOption(option: AppSelectOption) {
  if (option.disabled) {
    return
  }
  model.value = option.value
  close()
}

function moveHighlight(delta: number) {
  if (!props.options.length) {
    return
  }
  let next = highlightIndex.value
  for (let attempt = 0; attempt < props.options.length; attempt += 1) {
    next = (next + delta + props.options.length) % props.options.length
    if (!props.options[next]?.disabled) {
      highlightIndex.value = next
      return
    }
  }
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (props.disabled) {
    return
  }

  if (
    event.key === 'ArrowDown'
    || event.key === 'ArrowUp'
    || event.key === 'Enter'
    || event.key === ' '
  ) {
    event.preventDefault()
    if (!open.value) {
      openList()
      return
    }
  }

  if (!open.value) {
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    moveHighlight(1)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    moveHighlight(-1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    const option = props.options[highlightIndex.value]
    if (option) {
      selectOption(option)
    }
  } else if (event.key === 'Escape') {
    event.preventDefault()
    close()
  } else if (event.key === 'Home') {
    event.preventDefault()
    highlightIndex.value = 0
  } else if (event.key === 'End') {
    event.preventDefault()
    highlightIndex.value = props.options.length - 1
  }
}

onClickOutside(
  rootRef,
  () => {
    if (open.value) {
      close()
    }
  },
  { ignore: [listRef] }
)

watch(
  () => model.value,
  () => {
    if (!open.value) {
      return
    }
    const current = props.options.findIndex(option => option.value === model.value)
    if (current >= 0) {
      highlightIndex.value = current
    }
  }
)

let stopEscape: (() => void) | undefined

onMounted(() => {
  stopEscape = useEventListener(document, 'keydown', (event: KeyboardEvent) => {
    if (event.key === 'Escape' && open.value) {
      close()
    }
  })
})

onBeforeUnmount(() => {
  stopEscape?.()
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative w-full"
  >
    <button
      type="button"
      class="flex w-full items-center justify-between gap-2 rounded-md border border-default bg-default px-3 py-2 text-left text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
      :class="open ? 'ring-2 ring-primary' : 'hover:bg-muted/40'"
      :disabled="disabled"
      :aria-label="ariaLabel"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :data-testid="testId"
      @click="toggle"
      @keydown="onTriggerKeydown"
    >
      <span :class="selectedOption ? 'text-default' : 'text-muted'">
        {{ displayLabel }}
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-4 shrink-0 text-muted transition-transform"
        :class="open ? 'rotate-180' : ''"
      />
    </button>

    <Teleport to="body">
      <ul
        v-if="open"
        ref="listRef"
        class="overflow-auto rounded-md border border-default bg-default py-1 shadow-lg"
        :style="panelStyle"
        role="listbox"
        tabindex="-1"
        :aria-activedescendant="
          highlightIndex >= 0 ? `${testId ?? 'select'}-opt-${highlightIndex}` : undefined
        "
        @keydown="onTriggerKeydown"
      >
        <li
          v-for="(option, index) in options"
          :id="`${testId ?? 'select'}-opt-${index}`"
          :key="option.value"
          role="option"
          class="cursor-pointer px-3 py-2 text-sm"
          :class="[
            option.disabled ? 'cursor-not-allowed opacity-40' : '',
            index === highlightIndex ? 'bg-primary/10 text-primary' : 'hover:bg-muted/50',
            option.value === model ? 'font-medium' : ''
          ]"
          :aria-selected="option.value === model"
          :aria-disabled="option.disabled || undefined"
          @mousedown.prevent="selectOption(option)"
          @mouseenter="highlightIndex = index"
        >
          <span class="flex items-center justify-between gap-2">
            {{ option.label }}
            <UIcon
              v-if="option.value === model"
              name="i-lucide-check"
              class="size-4"
            />
          </span>
        </li>
      </ul>
    </Teleport>
  </div>
</template>

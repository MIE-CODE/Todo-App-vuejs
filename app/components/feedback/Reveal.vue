<script setup lang="ts">
withDefaults(defineProps<{
  /** Stagger delay in ms for sequenced reveals */
  delay?: number
  /** Animation direction */
  from?: 'up' | 'down' | 'left' | 'right' | 'none'
}>(), {
  delay: 0,
  from: 'up'
})

const root = ref<HTMLElement | null>(null)
const visible = ref(false)
const armed = ref(false)

let observer: IntersectionObserver | null = null

onMounted(() => {
  if (!root.value) {
    visible.value = true
    return
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduced) {
    visible.value = true
    return
  }

  armed.value = true

  const reveal = () => {
    visible.value = true
    observer?.disconnect()
    observer = null
  }

  // Already in (or near) the viewport: animate in on the next frame.
  const rect = root.value.getBoundingClientRect()
  if (rect.top < window.innerHeight * 0.92) {
    requestAnimationFrame(() => requestAnimationFrame(reveal))
    return
  }

  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        reveal()
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
  )

  observer.observe(root.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div
    ref="root"
    class="reveal"
    :class="[
      `reveal--${from}`,
      {
        'reveal--armed': armed && !visible,
        'reveal--visible': visible || !armed
      }
    ]"
    :style="{ transitionDelay: visible ? `${delay}ms` : '0ms' }"
  >
    <slot />
  </div>
</template>

<style scoped>
.reveal {
  transition:
    opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
    transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
  will-change: opacity, transform;
}

.reveal--armed {
  opacity: 0;
}

.reveal--armed.reveal--up {
  transform: translateY(28px);
}

.reveal--armed.reveal--down {
  transform: translateY(-20px);
}

.reveal--armed.reveal--left {
  transform: translateX(-28px);
}

.reveal--armed.reveal--right {
  transform: translateX(28px);
}

.reveal--armed.reveal--none {
  transform: none;
}

.reveal--visible {
  opacity: 1;
  transform: none;
}

@media (prefers-reduced-motion: reduce) {
  .reveal {
    opacity: 1 !important;
    transform: none !important;
    transition: none !important;
  }
}
</style>

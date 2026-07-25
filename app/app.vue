<script setup lang="ts">
import { onMounted } from 'vue'

useHead({
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [{ rel: 'icon', href: '/favicon.ico' }]
})

const { toasts, dismiss } = useAppToast()

// Deterministic hydration signal: lets E2E tests wait until interactive
// handlers are attached before submitting SSR-rendered forms.
onMounted(() => {
  document.documentElement.dataset.hydrated = 'true'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <!-- Teleport toast viewport out of layout flow -->
    <Teleport to="body">
      <div
        class="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        aria-relevant="additions"
      >
        <TransitionGroup name="toast">
          <div
            v-for="toast in toasts"
            :key="toast.id"
            class="pointer-events-auto w-full max-w-md"
          >
            <UAlert
              :title="toast.title"
              :description="toast.description"
              :color="toast.color"
              variant="subtle"
              :close-button="{ icon: 'i-lucide-x', color: 'neutral', variant: 'link' }"
              @close="dismiss(toast.id)"
            />
          </div>
        </TransitionGroup>
      </div>
    </Teleport>
  </UApp>
</template>

<style>
.page-enter-active,
.page-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>

<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps<{
  error: NuxtError
}>()

const handleError = () => clearError({ redirect: '/' })

useSeoMeta({
  title: 'Something went wrong',
  robots: 'noindex'
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-default px-4">
    <div class="w-full max-w-lg space-y-4 rounded-2xl border border-default p-8 text-center shadow-sm">
      <UBadge color="error" variant="subtle">
        {{ error.statusCode || 500 }}
      </UBadge>
      <h1 class="text-2xl font-bold">
        {{ error.statusCode === 404 ? 'Page not found' : 'Unexpected error' }}
      </h1>
      <p class="text-muted">
        {{ error.statusMessage || error.message || 'Please try again.' }}
      </p>
      <div class="flex justify-center gap-2">
        <UButton @click="handleError">
          Go home
        </UButton>
        <UButton
          color="neutral"
          variant="soft"
          to="/tasks"
        >
          Open Tasks
        </UButton>
      </div>
    </div>
  </div>
</template>

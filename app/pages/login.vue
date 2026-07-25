<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useSeoMeta({
  title: 'Sign in · TaskFlow',
  description: 'Sign in to your TaskFlow account.'
})

const route = useRoute()

const errorMessage = computed(() => {
  if (route.query.error === 'oauth_state' || route.query.error === 'oauth_provider') {
    return 'Social sign-in could not be completed. Please try again.'
  }
  return null
})
</script>

<template>
  <UCard>
    <div class="space-y-6">
      <div class="space-y-1 text-center">
        <h1 class="text-2xl font-semibold">
          Welcome back
        </h1>
        <p class="text-sm text-muted">
          Sign in to continue to TaskFlow
        </p>
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :description="errorMessage"
        icon="i-lucide-triangle-alert"
      />

      <SocialAuthButtons />

      <div class="flex items-center gap-3 text-xs uppercase text-muted">
        <span class="h-px flex-1 bg-default" />
        or
        <span class="h-px flex-1 bg-default" />
      </div>

      <LoginForm />

      <p class="text-center text-sm text-muted">
        New to TaskFlow?
        <NuxtLink
          to="/register"
          class="font-medium text-primary hover:underline"
        >
          Create an account
        </NuxtLink>
      </p>
    </div>
  </UCard>
</template>

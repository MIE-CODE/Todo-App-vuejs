<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest'
})

useSeoMeta({
  title: 'Create account · TaskFlow',
  description: 'Create your free TaskFlow account.'
})
</script>

<template>
  <UCard>
    <div class="space-y-6">
      <div class="space-y-1 text-center">
        <h1 class="text-2xl font-semibold">
          Create your account
        </h1>
        <p class="text-sm text-muted">
          Start organizing your day in seconds
        </p>
      </div>

      <SocialAuthButtons />

      <div class="flex items-center gap-3 text-xs uppercase text-muted">
        <span class="h-px flex-1 bg-default" />
        or
        <span class="h-px flex-1 bg-default" />
      </div>

      <RegisterForm />

      <p class="text-center text-sm text-muted">
        Already have an account?
        <NuxtLink
          to="/login"
          class="font-medium text-primary hover:underline"
        >
          Sign in
        </NuxtLink>
      </p>
    </div>
  </UCard>
</template>

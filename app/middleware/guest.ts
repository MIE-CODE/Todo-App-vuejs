import { useAuthStore } from '#features/auth/stores/useAuthStore'

/** Keeps signed-in users out of the login/register pages. */
export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuthStore()
  await auth.ensureLoaded()

  if (auth.isAuthenticated) {
    return navigateTo('/dashboard')
  }
})

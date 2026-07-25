import { useAuthStore } from '#features/auth/stores/useAuthStore'

/**
 * Protects authenticated pages. Preserves the intended destination so the user
 * lands where they meant to go after signing in.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuthStore()
  await auth.ensureLoaded()

  if (!auth.isAuthenticated) {
    return navigateTo({
      path: '/login',
      query: { redirect: to.fullPath }
    })
  }
})

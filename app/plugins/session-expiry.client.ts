import { watch } from 'vue'
import { useAuthStore } from '#features/auth/stores/useAuthStore'
import { useAppToast } from '#shared/composables/useAppToast'

/**
 * Client-side session expiry watchdog.
 *
 * Login is cookie-based with a sliding 3-hour idle window: every authenticated
 * API call extends both the httpOnly cookie (server) and this client timer.
 * When the idle window elapses, auth is cleared and protected routes auto-
 * navigate to /login — no manual refresh required.
 */
export default defineNuxtPlugin(() => {
  const auth = useAuthStore()
  const router = useRouter()
  const { push: pushToast } = useAppToast()

  let timer: ReturnType<typeof setTimeout> | null = null

  function clearTimer() {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  function routeRequiresAuth(): boolean {
    const middleware = router.currentRoute.value.meta.middleware
    if (Array.isArray(middleware)) {
      return middleware.includes('auth')
    }
    return middleware === 'auth'
  }

  async function handleExpiry() {
    if (!auth.isAuthenticated) {
      return
    }

    auth.clearSession()
    pushToast({
      title: 'Session expired',
      description: 'Please sign in again to continue.',
      color: 'info'
    })

    if (routeRequiresAuth()) {
      await router.push({
        path: '/login',
        query: { redirect: router.currentRoute.value.fullPath }
      })
    }
  }

  function schedule(expiresAt: string | null) {
    clearTimer()
    if (!expiresAt) {
      return
    }

    const delay = new Date(expiresAt).getTime() - Date.now()
    if (delay <= 0) {
      void handleExpiry()
      return
    }

    timer = setTimeout(() => {
      void handleExpiry()
    }, delay)
  }

  watch(
    () => auth.sessionExpiresAt,
    (expiresAt) => {
      schedule(expiresAt)
    },
    { immediate: true }
  )
})

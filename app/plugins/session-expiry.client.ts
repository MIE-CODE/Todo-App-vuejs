import { watch } from 'vue'
import { useAuthStore } from '#features/auth/stores/useAuthStore'
import { useAppToast } from '#shared/composables/useAppToast'

/**
 * Client-side session expiry watchdog.
 *
 * The server issues 3-hour sessions. This schedules a timer for the exact
 * expiry moment so the app reacts on its own — clearing auth state and, if the
 * user is sitting on a protected page, navigating them back out to /login
 * without needing a manual refresh.
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

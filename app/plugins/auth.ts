import { useAuthStore } from '#features/auth/stores/useAuthStore'

/**
 * Loads the current session once at app startup (server + client) so every
 * layout/page knows who is signed in before first paint, keeping SSR and the
 * client hydration in agreement.
 *
 * Runs after the api plugin (alphabetical order) so `$api` is available.
 */
export default defineNuxtPlugin(async () => {
  const auth = useAuthStore()
  try {
    await auth.ensureLoaded()
  } catch {
    // A failed session probe should never block rendering; treat as guest.
  }
})

import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { OAuthProvider } from '#shared/constants/app'
import type {
  SessionSummary,
  SessionUser,
  UserPreferences
} from '#shared/types/api'
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdatePreferencesInput,
  UpdateProfileInput
} from '#shared/schemas/auth'

/**
 * Auth store: the single client-side source of truth for "who is signed in".
 *
 * SSR-safe: `fetchSession` runs during server render (cookies forwarded via
 * $api) so the correct user is known on first paint and hydration matches.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<SessionUser | null>(null)
  const preferences = ref<UserPreferences | null>(null)
  const sessions = ref<SessionSummary[]>([])
  const loaded = ref(false)
  /** ISO expiry of the active session; drives client-side auto-logout. */
  const sessionExpiresAt = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)

  async function fetchSession(): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{
      user: SessionUser | null
      preferences: UserPreferences | null
      expiresAt: string | null
    }>('/api/auth/session')

    user.value = result.user
    preferences.value = result.preferences
    sessionExpiresAt.value = result.expiresAt
    loaded.value = true
  }

  /** Clears client auth state locally (used when the session expires). */
  function clearSession(): void {
    user.value = null
    preferences.value = null
    sessions.value = []
    sessionExpiresAt.value = null
  }

  /** Fetches the session exactly once per app lifecycle (idempotent). */
  async function ensureLoaded(): Promise<void> {
    if (!loaded.value) {
      await fetchSession()
    }
  }

  async function register(input: RegisterInput): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{ user: SessionUser }>('/api/auth/register', {
      method: 'POST',
      body: input
    })
    user.value = result.user
    await fetchSession()
  }

  async function login(input: LoginInput): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: input
    })
    user.value = result.user
    await fetchSession()
  }

  async function logout(): Promise<void> {
    const { $api } = useNuxtApp()
    await $api('/api/auth/logout', { method: 'POST' })
    clearSession()
  }

  function startOAuth(provider: OAuthProvider): Promise<void> {
    return (async () => {
      const { $api } = useNuxtApp()
      const { authorizeUrl } = await $api<{ authorizeUrl: string }>(
        `/api/auth/oauth/${provider}/start`,
        { method: 'POST' }
      )
      // Navigate the browser to the (simulated) provider authorize URL.
      window.location.href = authorizeUrl
    })()
  }

  async function updateProfile(input: UpdateProfileInput): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{ user: SessionUser }>('/api/auth/profile', {
      method: 'PATCH',
      body: input
    })
    user.value = result.user
  }

  async function updatePreferences(input: UpdatePreferencesInput): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{ preferences: UserPreferences }>('/api/auth/preferences', {
      method: 'PATCH',
      body: input
    })
    preferences.value = result.preferences
  }

  async function changePassword(input: ChangePasswordInput): Promise<void> {
    const { $api } = useNuxtApp()
    await $api('/api/auth/password', { method: 'PATCH', body: input })
    if (user.value) {
      user.value = { ...user.value, hasPassword: true }
    }
  }

  async function fetchSessions(): Promise<void> {
    const { $api } = useNuxtApp()
    const result = await $api<{ sessions: SessionSummary[] }>('/api/auth/sessions')
    sessions.value = result.sessions
  }

  async function revokeOtherSessions(): Promise<number> {
    const { $api } = useNuxtApp()
    const { revoked } = await $api<{ revoked: number }>('/api/auth/sessions', {
      method: 'DELETE'
    })
    await fetchSessions()
    return revoked
  }

  return {
    user,
    preferences,
    sessions,
    loaded,
    sessionExpiresAt,
    isAuthenticated,
    fetchSession,
    ensureLoaded,
    clearSession,
    register,
    login,
    logout,
    startOAuth,
    updateProfile,
    updatePreferences,
    changePassword,
    fetchSessions,
    revokeOtherSessions
  }
})

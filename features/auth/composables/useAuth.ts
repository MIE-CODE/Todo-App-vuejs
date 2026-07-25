import { computed } from 'vue'
import type { OAuthProvider } from '#shared/constants/app'
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdatePreferencesInput,
  UpdateProfileInput
} from '#shared/schemas/auth'
import { extractApiErrorMessage } from '#shared/utils/apiError'
import { useAppToast } from '#shared/composables/useAppToast'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

/**
 * Orchestration composable for auth flows.
 * Components call this — never the store or $fetch directly — so navigation,
 * toasts, and error handling stay consistent across every auth surface.
 */
export function useAuth() {
  const store = useAuthStore()
  const toast = useAppToast()
  const route = useRoute()

  const user = computed(() => store.user)
  const preferences = computed(() => store.preferences)
  const isAuthenticated = computed(() => store.isAuthenticated)

  function redirectTarget(): string {
    const target = route.query.redirect
    if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
      return target
    }
    return '/dashboard'
  }

  async function register(input: RegisterInput): Promise<boolean> {
    try {
      await store.register(input)
      toast.success('Welcome to TaskFlow', 'Your account is ready.')
      await navigateTo(redirectTarget())
      return true
    } catch (error) {
      toast.error('Could not create account', extractApiErrorMessage(error))
      return false
    }
  }

  async function login(input: LoginInput): Promise<boolean> {
    try {
      await store.login(input)
      toast.success('Signed in', 'Welcome back.')
      await navigateTo(redirectTarget())
      return true
    } catch (error) {
      toast.error('Sign in failed', extractApiErrorMessage(error))
      return false
    }
  }

  async function loginWithProvider(provider: OAuthProvider): Promise<void> {
    try {
      await store.startOAuth(provider)
    } catch (error) {
      toast.error('Social sign-in failed', extractApiErrorMessage(error))
    }
  }

  async function logout(): Promise<void> {
    try {
      await store.logout()
      toast.success('Signed out', 'See you soon.')
      await navigateTo('/login')
    } catch (error) {
      toast.error('Sign out failed', extractApiErrorMessage(error))
    }
  }

  async function updateProfile(input: UpdateProfileInput): Promise<boolean> {
    try {
      await store.updateProfile(input)
      toast.success('Profile updated')
      return true
    } catch (error) {
      toast.error('Update failed', extractApiErrorMessage(error))
      return false
    }
  }

  async function updatePreferences(input: UpdatePreferencesInput): Promise<boolean> {
    try {
      await store.updatePreferences(input)
      toast.success('Preferences saved')
      return true
    } catch (error) {
      toast.error('Could not save preferences', extractApiErrorMessage(error))
      return false
    }
  }

  async function changePassword(input: ChangePasswordInput): Promise<boolean> {
    try {
      await store.changePassword(input)
      toast.success('Password changed', 'Other sessions were signed out.')
      return true
    } catch (error) {
      toast.error('Could not change password', extractApiErrorMessage(error))
      return false
    }
  }

  return {
    store,
    user,
    preferences,
    isAuthenticated,
    register,
    login,
    loginWithProvider,
    logout,
    updateProfile,
    updatePreferences,
    changePassword
  }
}

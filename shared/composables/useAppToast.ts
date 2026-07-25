import { readonly, ref, type Ref } from 'vue'

export type ToastColor = 'success' | 'error' | 'warning' | 'info' | 'neutral'

export interface ToastMessage {
  id: string
  title: string
  description?: string
  color: ToastColor
  timeout?: number
}

const toasts: Ref<ToastMessage[]> = ref([])

/**
 * Lightweight toast bus for feature feedback.
 * Nuxt UI also has useToast; this composable teaches provide/inject-free shared state patterns.
 */
export function useAppToast() {
  function push(message: Omit<ToastMessage, 'id'>) {
    const id = crypto.randomUUID()
    const entry: ToastMessage = { id, timeout: 4000, ...message }
    toasts.value = [...toasts.value, entry]

    if (import.meta.client && entry.timeout && entry.timeout > 0) {
      window.setTimeout(() => dismiss(id), entry.timeout)
    }

    return id
  }

  function dismiss(id: string) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function success(title: string, description?: string) {
    return push({ title, description, color: 'success' })
  }

  function error(title: string, description?: string) {
    return push({ title, description, color: 'error' })
  }

  return {
    toasts: readonly(toasts),
    push,
    dismiss,
    success,
    error
  }
}

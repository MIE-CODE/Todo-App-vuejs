import { readonly, ref, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

/**
 * Search box state with debounce.
 * Debouncing protects the API from keystroke storms.
 */
export function useSearch(delayMs = 300) {
  const search = ref('')
  const debouncedSearch = ref('')

  const updateDebounced = useDebounceFn((value: string) => {
    debouncedSearch.value = value.trim()
  }, delayMs)

  watch(search, (value) => {
    updateDebounced(value)
  })

  function clear() {
    search.value = ''
    debouncedSearch.value = ''
  }

  return {
    search,
    debouncedSearch: readonly(debouncedSearch),
    clear
  }
}

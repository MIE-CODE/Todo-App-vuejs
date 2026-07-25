import { computed } from 'vue'

/**
 * Theme helpers on top of Nuxt Color Mode.
 * Lives in app/composables because it depends on a Nuxt module auto-import.
 */
export function useTheme() {
  const colorMode = useColorMode()

  const isDark = computed({
    get: () => colorMode.value === 'dark',
    set: (value: boolean) => {
      colorMode.preference = value ? 'dark' : 'light'
    }
  })

  function toggle() {
    isDark.value = !isDark.value
  }

  function setTheme(theme: 'light' | 'dark' | 'system') {
    colorMode.preference = theme
  }

  return {
    colorMode,
    isDark,
    toggle,
    setTheme
  }
}

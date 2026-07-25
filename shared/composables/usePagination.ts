import { computed, ref } from 'vue'
import { DEFAULT_PAGE_SIZE } from '#shared/constants/app'

/**
 * Pagination state composable.
 * Keeps page math out of components (KISS + single responsibility).
 */
export function usePagination(initialPageSize = DEFAULT_PAGE_SIZE) {
  const page = ref(1)
  const pageSize = ref(initialPageSize)
  const total = ref(0)

  const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const hasNextPage = computed(() => page.value < totalPages.value)
  const hasPreviousPage = computed(() => page.value > 1)
  const offset = computed(() => (page.value - 1) * pageSize.value)

  function setTotal(nextTotal: number) {
    total.value = Math.max(0, nextTotal)

    if (page.value > totalPages.value) {
      page.value = totalPages.value
    }
  }

  function next() {
    if (hasNextPage.value) {
      page.value += 1
    }
  }

  function previous() {
    if (hasPreviousPage.value) {
      page.value -= 1
    }
  }

  function goTo(nextPage: number) {
    page.value = Math.min(Math.max(1, nextPage), totalPages.value)
  }

  function reset() {
    page.value = 1
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage,
    hasPreviousPage,
    offset,
    setTotal,
    next,
    previous,
    goTo,
    reset
  }
}

import { ref } from 'vue'
import type { Task, UpdateTaskInput } from '#features/tasks/schemas/task'
import { extractApiErrorMessage } from '#shared/utils/apiError'
import { useAppToast } from '#shared/composables/useAppToast'

/**
 * Single-task detail/edit orchestration.
 *
 * SSR-loads one task, then performs optimistic-free (but version-checked)
 * updates and deletes directly against the API. Kept separate from the board
 * store because the detail page can be entered directly without a loaded list.
 */
export function useTaskDetail(taskId: MaybeRefOrGetter<string>) {
  const { $api } = useNuxtApp()
  const toast = useAppToast()

  const id = computed(() => toValue(taskId))

  const asyncData = useAsyncData<Task>(
    () => `task-${id.value}`,
    () => $api<Task>(`/api/tasks/${id.value}`),
    { watch: [id] }
  )

  const saving = ref(false)
  const removing = ref(false)

  async function save(input: Omit<UpdateTaskInput, 'version'>): Promise<boolean> {
    const current = asyncData.data.value
    if (!current) {
      return false
    }

    saving.value = true
    try {
      const updated = await $api<Task>(`/api/tasks/${id.value}`, {
        method: 'PATCH',
        body: { ...input, version: current.version }
      })
      asyncData.data.value = updated
      toast.success('Task saved')
      return true
    } catch (error) {
      // 409 means someone/another tab changed it — reload to show the latest.
      await asyncData.refresh()
      toast.error('Could not save task', extractApiErrorMessage(error))
      return false
    } finally {
      saving.value = false
    }
  }

  async function remove(): Promise<void> {
    removing.value = true
    try {
      await $api(`/api/tasks/${id.value}`, { method: 'DELETE' })
      toast.success('Task deleted')
      await navigateTo('/tasks')
    } catch (error) {
      toast.error('Could not delete task', extractApiErrorMessage(error))
    } finally {
      removing.value = false
    }
  }

  return { ...asyncData, saving, removing, save, remove }
}

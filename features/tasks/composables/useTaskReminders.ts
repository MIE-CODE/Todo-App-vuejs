import { computed, onScopeDispose, ref, watch } from 'vue'
import type { Task } from '#features/tasks/schemas/task'
import { combineDueDateTime } from '#shared/utils/date'
import { useTaskStore } from '#features/tasks/stores/useTaskStore'
import { useAuthStore } from '#features/auth/stores/useAuthStore'

/**
 * Client-side reminder scheduler for the Plus/Pro `task_reminders` entitlement.
 *
 * Watches board tasks that carry both a due date and a `HH:mm` time, then rings
 * an in-app alarm at the local wall-clock moment. A short polling loop backs up
 * the precise timers so alarms still fire after the tab sleeps, and fired
 * moments are deduped in `sessionStorage` so a refresh does not re-ring.
 */

/** How long after the due moment we still ring (covers tab sleep / late loads). */
const GRACE_MS = 5 * 60 * 1000
/** Backup evaluation cadence. */
const POLL_MS = 15 * 1000
/** Only arm a precise timer for tasks due within this window. */
const PRECISE_WINDOW_MS = 60 * 1000

function alarmKey(taskId: string, dueIso: string): string {
  return `taskflow:alarmed:${taskId}:${dueIso}`
}

export function useTaskReminders() {
  const store = useTaskStore()
  const auth = useAuthStore()

  const enabled = computed(
    () => auth.user?.entitlements.includes('task_reminders') ?? false
  )

  /** FIFO of tasks whose alarm has fired; the head drives the visible modal. */
  const queue = ref<Task[]>([])
  const activeAlarm = computed<Task | null>(() => queue.value[0] ?? null)

  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  let poll: ReturnType<typeof setInterval> | null = null

  function isEligible(task: Task): boolean {
    return (
      Boolean(task.dueDate && task.dueTime)
      && task.status !== 'done'
      && task.status !== 'archived'
    )
  }

  function alreadyAlarmed(key: string): boolean {
    try {
      return sessionStorage.getItem(key) === '1'
    } catch {
      return false
    }
  }

  function markAlarmed(key: string) {
    try {
      sessionStorage.setItem(key, '1')
    } catch {
      // Private mode / quota — dedupe is best-effort only.
    }
  }

  function fire(task: Task, dueIso: string) {
    const key = alarmKey(task.id, dueIso)
    if (alreadyAlarmed(key) || queue.value.some(entry => entry.id === task.id)) {
      return
    }
    markAlarmed(key)
    queue.value = [...queue.value, task]
  }

  function clearTimers() {
    timers.forEach(id => clearTimeout(id))
    timers.clear()
  }

  function evaluate() {
    if (!enabled.value) {
      return
    }

    clearTimers()
    const now = Date.now()

    for (const task of store.items) {
      if (!isEligible(task)) {
        continue
      }

      const iso = combineDueDateTime(task.dueDate, task.dueTime)
      if (!iso) {
        continue
      }

      const key = alarmKey(task.id, iso)
      if (alreadyAlarmed(key)) {
        continue
      }

      const delta = new Date(iso).getTime() - now

      if (delta <= 0) {
        // Due already — ring only if it just passed, not for stale tasks.
        if (Math.abs(delta) <= GRACE_MS) {
          fire(task, iso)
        }
        continue
      }

      if (delta <= PRECISE_WINDOW_MS) {
        timers.set(
          task.id,
          setTimeout(() => fire(task, iso), delta)
        )
      }
    }
  }

  function dismiss() {
    queue.value = queue.value.slice(1)
  }

  if (import.meta.client) {
    // Hydrate from cache so alarms work on any auth page, not just /tasks.
    if (!store.items.length) {
      store.hydrateFromStorage()
    }

    watch(() => store.items, evaluate, { deep: true, immediate: true })
    watch(enabled, (value) => {
      if (value) {
        evaluate()
      } else {
        clearTimers()
        queue.value = []
      }
    })

    poll = setInterval(evaluate, POLL_MS)

    onScopeDispose(() => {
      clearTimers()
      if (poll) {
        clearInterval(poll)
      }
    })
  }

  return { activeAlarm, dismiss, enabled }
}

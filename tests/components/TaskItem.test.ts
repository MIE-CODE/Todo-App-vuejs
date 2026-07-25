import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import TaskItem from '#features/tasks/components/TaskItem.vue'
import { taskBoardKey } from '#features/tasks/composables/useTaskBoard'
import type { Task } from '#features/tasks/schemas/task'

const sampleTask: Task = {
  id: 'task_1',
  userId: 'user_1',
  title: 'Component test task',
  description: 'Ensures TaskItem renders title',
  status: 'todo',
  priority: 'medium',
  dueDate: null,
  tags: ['vitest'],
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  completedAt: null
}

function mountTaskItem(overrides: Partial<Task> = {}) {
  const rename = vi.fn(async () => undefined)
  const selectedIds = ref<string[]>([])

  const Host = defineComponent({
    setup() {
      provide(taskBoardKey, {
        selectedId: ref<string | null>(null),
        selectedIds,
        select: () => undefined,
        toggleMultiSelect: (id: string) => {
          if (selectedIds.value.includes(id)) {
            selectedIds.value = selectedIds.value.filter((entry) => entry !== id)
          } else {
            selectedIds.value = [...selectedIds.value, id]
          }
        },
        isMultiSelected: (id: string) => selectedIds.value.includes(id),
        toggleDone: async () => undefined,
        remove: async () => undefined,
        moveToStatus: async () => undefined,
        moveTaskById: async () => undefined,
        rename,
        selectAllInColumn: () => undefined,
        deselectInColumn: () => undefined
      })

      return () => h(TaskItem, { task: { ...sampleTask, ...overrides } })
    }
  })

  const wrapper = mount(Host, {
    global: {
      stubs: {
        UCheckbox: true,
        UBadge: true,
        UButton: true,
        UIcon: true,
        AppSelect: true
      }
    }
  })

  return { wrapper, rename }
}

describe('TaskItem', () => {
  it('renders the task title', () => {
    const { wrapper } = mountTaskItem()
    expect(wrapper.text()).toContain('Component test task')
  })

  it('enters inline edit on double-click and renames on blur', async () => {
    const { wrapper, rename } = mountTaskItem()
    const card = wrapper.find('[data-testid="task-card-task_1"]')
    await card.trigger('dblclick')
    await nextTick()

    const input = wrapper.find('[data-testid="inline-title-input"]')
    expect(input.exists()).toBe(true)
    await input.setValue('Renamed in place')
    await input.trigger('blur')
    await nextTick()

    expect(rename).toHaveBeenCalled()
  })
})

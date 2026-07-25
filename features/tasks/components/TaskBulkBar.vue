<script setup lang="ts">
import { ref, watch } from 'vue'
import type { BoardStatus } from '#features/tasks/utils/groupByStatus'
import { BOARD_STATUSES, BOARD_STATUS_LABELS } from '#features/tasks/utils/groupByStatus'

const props = defineProps<{
  count: number
  pending?: boolean
}>()

const emit = defineEmits<{
  clear: []
  complete: []
  delete: []
  move: [status: BoardStatus]
}>()

const moveStatus = ref<BoardStatus>('todo')
const confirmDelete = ref(false)

const moveOptions = BOARD_STATUSES.map((value) => ({
  label: BOARD_STATUS_LABELS[value],
  value
}))

watch(
  () => props.count,
  (count) => {
    if (count === 0) {
      confirmDelete.value = false
    }
  }
)

function onMove() {
  emit('move', moveStatus.value)
}

function onDelete() {
  if (!confirmDelete.value) {
    confirmDelete.value = true
    return
  }
  confirmDelete.value = false
  emit('delete')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="bulk-bar">
      <div
        v-if="count > 0"
        class="pointer-events-none fixed inset-x-0 bottom-6 z-40 flex justify-center px-4"
        data-testid="task-bulk-bar"
      >
        <div
          class="pointer-events-auto flex max-w-full flex-wrap items-center gap-2 rounded-2xl border border-default bg-default/95 px-3 py-2 shadow-lg backdrop-blur"
        >
          <p class="px-1 text-sm font-medium">
            {{ count }} selected
          </p>

          <UButton
            color="neutral"
            variant="ghost"
            size="sm"
            @click="emit('clear')"
          >
            Clear
          </UButton>

          <UButton
            color="primary"
            variant="soft"
            size="sm"
            icon="i-lucide-check"
            :loading="pending"
            data-testid="bulk-complete"
            @click="emit('complete')"
          >
            Complete
          </UButton>

          <div class="flex items-center gap-1">
            <div class="w-36">
              <AppSelect
                v-model="moveStatus"
                :options="moveOptions"
                test-id="bulk-move-select"
                aria-label="Move selected to"
              />
            </div>
            <UButton
              color="neutral"
              variant="soft"
              size="sm"
              :loading="pending"
              data-testid="bulk-move"
              @click="onMove"
            >
              Move
            </UButton>
          </div>

          <UButton
            color="error"
            :variant="confirmDelete ? 'solid' : 'soft'"
            size="sm"
            icon="i-lucide-trash-2"
            :loading="pending"
            data-testid="bulk-delete"
            @click="onDelete"
          >
            {{ confirmDelete ? 'Confirm delete' : 'Delete' }}
          </UButton>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.bulk-bar-enter-active,
.bulk-bar-leave-active {
  transition: all 0.2s ease;
}

.bulk-bar-enter-from,
.bulk-bar-leave-to {
  opacity: 0;
  transform: translateY(12px);
}
</style>

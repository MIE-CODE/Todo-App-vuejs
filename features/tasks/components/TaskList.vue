<script setup lang="ts">
import type { Task } from '#features/tasks/schemas/task'

defineProps<{
  tasks: Task[]
}>()

/**
 * TransitionGroup teaches list animations without coupling animation to store logic.
 */
</script>

<template>
  <div
    role="listbox"
    aria-label="Tasks"
    class="space-y-2"
  >
    <TransitionGroup
      name="task-list"
      tag="div"
      class="space-y-2"
    >
      <TaskItem
        v-for="task in tasks"
        :key="task.id"
        :task="task"
      />
    </TransitionGroup>
  </div>
</template>

<style scoped>
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.2s ease;
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.task-list-move {
  transition: transform 0.2s ease;
}
</style>

<script setup lang="ts">
import type { FocusSessionSlot, WorkloadDay } from '#features/focus-orbit/types'

defineProps<{
  sessions: FocusSessionSlot[]
  workload: WorkloadDay[]
}>()
</script>

<template>
  <div class="grid gap-4 lg:grid-cols-2">
    <UCard data-testid="focus-sessions">
      <template #header>
        <h3 class="font-semibold">
          Focus sessions
        </h3>
      </template>
      <ul class="space-y-3">
        <li
          v-for="session in sessions"
          :key="session.id"
          class="rounded-xl border border-default px-3 py-3"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-sm font-medium">
                {{ session.label }}
              </p>
              <p class="text-xs text-muted">
                {{ session.startHour }}:00 · {{ session.durationMinutes }} min ·
                {{ session.taskIds.length }} tasks
              </p>
            </div>
            <UBadge
              color="primary"
              variant="subtle"
            >
              {{ session.focusScore }}%
            </UBadge>
          </div>
        </li>
        <li
          v-if="!sessions.length"
          class="py-6 text-center text-sm text-muted"
        >
          No open tasks to schedule yet.
        </li>
      </ul>
    </UCard>

    <UCard data-testid="workload-map">
      <template #header>
        <h3 class="font-semibold">
          Workload map
        </h3>
      </template>
      <div class="flex h-40 items-end gap-2">
        <div
          v-for="day in workload"
          :key="day.date"
          class="flex flex-1 flex-col items-center gap-2"
        >
          <div class="flex w-full flex-1 items-end">
            <div
              class="w-full rounded-t transition-all"
              :class="{
                'bg-emerald-400/80': day.band === 'light',
                'bg-primary/80': day.band === 'steady',
                'bg-rose-500/80': day.band === 'heavy'
              }"
              :style="{ height: `${Math.max(12, day.load * 100)}%` }"
              :title="`${day.openCount} open`"
            />
          </div>
          <span class="text-xs text-muted">{{ day.label }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

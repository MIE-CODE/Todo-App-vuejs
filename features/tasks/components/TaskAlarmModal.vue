<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { Task } from '#features/tasks/schemas/task'
import { formatTimeLabel } from '#shared/utils/date'

/**
 * Full-screen alarm overlay for a due task. Plays a looping two-tone Web Audio
 * ring for up to 30 seconds (no media asset needed) and stops on dismiss.
 */
defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  dismiss: []
}>()

/** Hard ceiling for the ringer, per spec. */
const RING_DURATION_MS = 30_000
const secondsLeft = ref(Math.round(RING_DURATION_MS / 1000))
const ringing = ref(true)

let audioContext: AudioContext | null = null
let beepTimer: ReturnType<typeof setInterval> | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null
let highTone = true

function playBeep() {
  if (!audioContext) {
    return
  }

  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.type = 'sine'
  // Alternate pitches for a classic "ring-ring" cadence.
  oscillator.frequency.value = highTone ? 880 : 660
  highTone = !highTone

  const now = audioContext.currentTime
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.28, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34)

  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.4)
}

function startRinger() {
  try {
    const AudioCtx
      = window.AudioContext
        ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) {
      return
    }
    audioContext = new AudioCtx()
    // Autoplay policies may suspend the context; resume is best-effort.
    void audioContext.resume?.()
    playBeep()
    beepTimer = setInterval(playBeep, 700)
  } catch {
    // Audio unavailable — the visual alarm still shows.
  }
}

function stopRinger() {
  ringing.value = false

  if (beepTimer) {
    clearInterval(beepTimer)
    beepTimer = null
  }
  if (stopTimer) {
    clearTimeout(stopTimer)
    stopTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (audioContext) {
    void audioContext.close().catch(() => {})
    audioContext = null
  }
}

function onDismiss() {
  stopRinger()
  emit('dismiss')
}

onMounted(() => {
  startRinger()

  stopTimer = setTimeout(stopRinger, RING_DURATION_MS)
  countdownTimer = setInterval(() => {
    secondsLeft.value = Math.max(0, secondsLeft.value - 1)
  }, 1000)
})

onBeforeUnmount(stopRinger)
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-300 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      :aria-label="`Reminder: ${task.title}`"
    >
      <div
        class="w-full max-w-sm overflow-hidden rounded-2xl border border-default bg-default shadow-2xl"
      >
        <div class="flex flex-col items-center gap-4 p-6 text-center">
          <span
            class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary"
            :class="ringing ? 'animate-pulse' : ''"
          >
            <UIcon
              name="i-lucide-alarm-clock"
              class="size-8"
            />
          </span>

          <div class="space-y-1">
            <p class="text-xs font-medium uppercase tracking-wide text-muted">
              Task due now
            </p>
            <h2 class="text-lg font-semibold leading-snug">
              {{ task.title }}
            </h2>
            <p
              v-if="task.dueTime"
              class="text-sm text-muted"
            >
              Scheduled for {{ formatTimeLabel(task.dueTime) }}
            </p>
          </div>

          <p class="text-xs text-muted">
            <template v-if="ringing">
              Ringing — auto-stops in {{ secondsLeft }}s
            </template>
            <template v-else>
              Alarm ended
            </template>
          </p>

          <UButton
            block
            size="lg"
            color="primary"
            icon="i-lucide-bell-off"
            data-testid="alarm-dismiss"
            @click="onDismiss"
          >
            Dismiss
          </UButton>
        </div>
      </div>
    </div>
  </Teleport>
</template>

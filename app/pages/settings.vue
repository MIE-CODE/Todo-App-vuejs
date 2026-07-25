<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { TaskPriority, ThemePreference, WeekStartDay } from '#shared/constants/app'
import { TASK_PRIORITIES, THEME_PREFERENCES, WEEK_START_DAYS } from '#shared/constants/app'
import type { PlanId } from '#shared/constants/billing'
import { useAuth } from '#features/auth/composables/useAuth'
import { useBilling } from '#features/billing/composables/useBilling'

definePageMeta({
  middleware: 'auth'
})

useSeoMeta({ title: 'Settings · TaskFlow' })

const { preferences, updatePreferences } = useAuth()
const { setTheme } = useTheme()
const {
  subscription,
  pendingPayment,
  confirming,
  lastError,
  fetchSubscription,
  startCheckout,
  confirmPayment
} = useBilling()

const checkoutOpen = ref(false)

const form = reactive({
  theme: preferences.value?.theme ?? 'system',
  defaultPriority: preferences.value?.defaultPriority ?? 'medium',
  weekStart: preferences.value?.weekStart ?? 'monday'
})

watch(preferences, (value) => {
  if (value) {
    form.theme = value.theme
    form.defaultPriority = value.defaultPriority
    form.weekStart = value.weekStart
  }
})

onMounted(async () => {
  await fetchSubscription()
})

/** Options for AppSelect: value stays the raw union, label is display-cased. */
function toOptions<T extends string>(values: readonly T[]) {
  return values.map(value => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1).replace('_', ' ')
  }))
}

const themeOptions = toOptions(THEME_PREFERENCES)
const priorityOptions = toOptions(TASK_PRIORITIES)
const weekStartOptions = toOptions(WEEK_START_DAYS)

async function onThemeChange(value: string) {
  form.theme = value as ThemePreference
  setTheme(form.theme)
  await updatePreferences({ theme: form.theme })
}

async function onPriorityChange(value: string) {
  form.defaultPriority = value as TaskPriority
  await updatePreferences({ defaultPriority: form.defaultPriority })
}

async function onWeekStartChange(value: string) {
  form.weekStart = value as WeekStartDay
  await updatePreferences({ weekStart: form.weekStart })
}

async function onUpgrade(planId: Exclude<PlanId, 'free'>) {
  const payment = await startCheckout(planId)
  if (payment) {
    checkoutOpen.value = true
  }
}

async function onConfirm(payload: {
  cardNumber: string
  cardExpiry: string
  cardCvc: string
}) {
  if (!pendingPayment.value) {
    return
  }
  const ok = await confirmPayment({
    attemptId: pendingPayment.value.id,
    ...payload
  })
  if (ok) {
    checkoutOpen.value = false
    await fetchSubscription()
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <h1 class="text-2xl font-semibold">
      Settings
    </h1>

    <SubscriptionCard
      :subscription="subscription"
      @upgrade="onUpgrade"
    />

    <UCard>
      <template #header>
        <h2 class="font-semibold">
          Preferences
        </h2>
      </template>

      <div class="space-y-4">
        <UFormField
          label="Theme"
          name="theme"
        >
          <AppSelect
            :model-value="form.theme"
            :options="themeOptions"
            test-id="theme-select"
            aria-label="Theme"
            @update:model-value="onThemeChange"
          />
        </UFormField>

        <UFormField
          label="Default task priority"
          name="defaultPriority"
        >
          <AppSelect
            :model-value="form.defaultPriority"
            :options="priorityOptions"
            test-id="default-priority-select"
            aria-label="Default task priority"
            @update:model-value="onPriorityChange"
          />
        </UFormField>

        <UFormField
          label="Week starts on"
          name="weekStart"
        >
          <AppSelect
            :model-value="form.weekStart"
            :options="weekStartOptions"
            test-id="week-start-select"
            aria-label="Week starts on"
            @update:model-value="onWeekStartChange"
          />
        </UFormField>
      </div>
    </UCard>

    <SessionsCard />

    <PasswordCard />

    <SandboxCheckoutModal
      v-model:open="checkoutOpen"
      :payment="pendingPayment"
      :confirming="confirming"
      :error="lastError"
      @confirm="onConfirm"
    />
  </div>
</template>

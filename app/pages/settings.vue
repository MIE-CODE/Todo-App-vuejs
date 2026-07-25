<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
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

async function onThemeChange() {
  setTheme(form.theme)
  await updatePreferences({ theme: form.theme })
}

async function onPriorityChange() {
  await updatePreferences({ defaultPriority: form.defaultPriority })
}

async function onWeekStartChange() {
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
          <select
            v-model="form.theme"
            data-testid="theme-select"
            class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm capitalize"
            @change="onThemeChange"
          >
            <option
              v-for="theme in THEME_PREFERENCES"
              :key="theme"
              :value="theme"
            >
              {{ theme }}
            </option>
          </select>
        </UFormField>

        <UFormField
          label="Default task priority"
          name="defaultPriority"
        >
          <select
            v-model="form.defaultPriority"
            class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm capitalize"
            @change="onPriorityChange"
          >
            <option
              v-for="priority in TASK_PRIORITIES"
              :key="priority"
              :value="priority"
            >
              {{ priority }}
            </option>
          </select>
        </UFormField>

        <UFormField
          label="Week starts on"
          name="weekStart"
        >
          <select
            v-model="form.weekStart"
            class="w-full rounded-md border border-default bg-default px-3 py-2 text-sm capitalize"
            @change="onWeekStartChange"
          >
            <option
              v-for="day in WEEK_START_DAYS"
              :key="day"
              :value="day"
            >
              {{ day }}
            </option>
          </select>
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

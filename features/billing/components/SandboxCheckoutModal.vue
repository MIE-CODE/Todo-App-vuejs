<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { PaymentAttemptSummary } from '#shared/types/api'
import { SANDBOX_CARDS, formatPrice, PLAN_NAMES } from '#shared/constants/billing'
import type { PlanId } from '#shared/constants/billing'

const props = defineProps<{
  open: boolean
  payment: PaymentAttemptSummary | null
  confirming: boolean
  error: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  confirm: [payload: { cardNumber: string; cardExpiry: string; cardCvc: string }]
  cancel: []
}>()

const form = reactive({
  cardNumber: '',
  cardExpiry: '',
  cardCvc: ''
})

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.cardNumber = ''
      form.cardExpiry = ''
      form.cardCvc = ''
    }
  }
)

function fillSuccessCard() {
  form.cardNumber = SANDBOX_CARDS.success
  form.cardExpiry = '12/30'
  form.cardCvc = '123'
}

function fillDeclineCard() {
  form.cardNumber = SANDBOX_CARDS.decline
  form.cardExpiry = '12/30'
  form.cardCvc = '123'
}

function onSubmit() {
  emit('confirm', {
    cardNumber: form.cardNumber,
    cardExpiry: form.cardExpiry,
    cardCvc: form.cardCvc
  })
}

function close() {
  emit('update:open', false)
  emit('cancel')
}

const planLabel = computed(() =>
  props.payment ? PLAN_NAMES[props.payment.planId as PlanId] : ''
)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      data-testid="sandbox-checkout-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-title"
      @click.self="close"
    >
      <div class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-default bg-default p-6 shadow-xl">
        <div class="space-y-5">
          <div class="space-y-1">
            <h2
              id="checkout-title"
              class="text-xl font-semibold"
            >
              Sandbox checkout
            </h2>
            <p class="text-sm text-muted">
              Confirm payment for <span class="font-medium text-default">{{ planLabel }}</span>
              · {{ payment ? formatPrice(payment.amountCents) : '' }}/mo.
              No real charges — this is a local payment simulator.
            </p>
          </div>

          <UAlert
            color="info"
            variant="subtle"
            title="Test cards"
            :description="`Success: ${SANDBOX_CARDS.success} · Decline: ${SANDBOX_CARDS.decline}`"
          />

          <div class="flex flex-wrap gap-2">
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              data-testid="fill-success-card"
              @click="fillSuccessCard"
            >
              Fill success card
            </UButton>
            <UButton
              size="xs"
              color="neutral"
              variant="soft"
              data-testid="fill-decline-card"
              @click="fillDeclineCard"
            >
              Fill decline card
            </UButton>
          </div>

          <form
            class="space-y-4"
            @submit.prevent="onSubmit"
          >
            <UFormField
              label="Card number"
              name="cardNumber"
            >
              <UInput
                v-model="form.cardNumber"
                data-testid="card-number"
                inputmode="numeric"
                autocomplete="cc-number"
                placeholder="4242 4242 4242 4242"
                class="w-full"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-3">
              <UFormField
                label="Expiry"
                name="cardExpiry"
              >
                <UInput
                  v-model="form.cardExpiry"
                  data-testid="card-expiry"
                  placeholder="MM/YY"
                  class="w-full"
                />
              </UFormField>
              <UFormField
                label="CVC"
                name="cardCvc"
              >
                <UInput
                  v-model="form.cardCvc"
                  data-testid="card-cvc"
                  inputmode="numeric"
                  placeholder="123"
                  class="w-full"
                />
              </UFormField>
            </div>

            <UAlert
              v-if="error"
              color="error"
              variant="subtle"
              :title="error"
              data-testid="checkout-error"
            />

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                color="neutral"
                variant="ghost"
                type="button"
                @click="close"
              >
                Cancel
              </UButton>
              <UButton
                type="submit"
                :loading="confirming"
                data-testid="confirm-payment"
              >
                Confirm payment
              </UButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

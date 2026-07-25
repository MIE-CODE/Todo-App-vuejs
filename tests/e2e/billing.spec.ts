import { expect, test } from '@playwright/test'
import { gotoHydrated, makeAccount, register } from './helpers'

test.describe('billing and Focus Orbit', () => {
  test('free users see a locked Focus Orbit and can unlock Plus via sandbox payment', async ({
    page
  }) => {
    await register(page, makeAccount('billing'))

    await gotoHydrated(page, '/analytics')
    await expect(page.getByTestId('focus-orbit-locked')).toBeVisible()
    await expect(page.getByTestId('focus-orbit-ring')).toBeVisible()

    // Premium API must stay forbidden before payment.
    const blocked = await page.request.get('/api/analytics/focus-orbit')
    expect(blocked.status()).toBe(403)

    await page.getByTestId('locked-upgrade-plus').click()
    await expect(page.getByTestId('sandbox-checkout-modal')).toBeVisible()
    await page.getByTestId('fill-success-card').click()
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/billing/confirm')
          && r.request().method() === 'POST'
          && r.ok()
      ),
      page.getByTestId('confirm-payment').click()
    ])

    await expect(page.getByTestId('focus-orbit-locked')).toHaveCount(0)
    await expect(page.getByTestId('focus-orbit-ring')).toBeVisible()
    await expect(page.getByTestId('focus-sessions')).toBeVisible()
    await expect(page.getByTestId('workload-map')).toBeVisible()
    await expect(page.getByTestId('pro-upsell')).toBeVisible()

    const allowed = await page.request.get('/api/analytics/focus-orbit')
    expect(allowed.ok()).toBeTruthy()
  })

  test('declined sandbox cards do not unlock premium', async ({ page }) => {
    await register(page, makeAccount('decline'))
    await gotoHydrated(page, '/settings')

    await expect(page.getByTestId('current-plan-badge')).toContainText(/free/i)
    await page.getByTestId('upgrade-plus').click()
    await expect(page.getByTestId('sandbox-checkout-modal')).toBeVisible()
    await page.getByTestId('fill-decline-card').click()
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/billing/confirm')
          && r.request().method() === 'POST'
          && r.ok()
      ),
      page.getByTestId('confirm-payment').click()
    ])

    await expect(page.getByTestId('checkout-error')).toBeVisible()
    await expect(page.getByTestId('current-plan-badge')).toContainText(/free/i)

    await gotoHydrated(page, '/analytics')
    await expect(page.getByTestId('focus-orbit-locked')).toBeVisible()
  })

  test('Pro unlocks forecasting and what-if controls', async ({ page }) => {
    await register(page, makeAccount('proplan'))
    await gotoHydrated(page, '/settings')

    await page.getByTestId('upgrade-pro').click()
    await page.getByTestId('fill-success-card').click()
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/billing/confirm')
          && r.request().method() === 'POST'
          && r.ok()
      ),
      page.getByTestId('confirm-payment').click()
    ])

    await gotoHydrated(page, '/analytics')
    await expect(page.getByTestId('orbit-pro-panels')).toBeVisible()
    await expect(page.getByTestId('what-if-controls')).toBeVisible()
    await expect(page.getByTestId('capacity-slider')).toBeVisible()
  })
})

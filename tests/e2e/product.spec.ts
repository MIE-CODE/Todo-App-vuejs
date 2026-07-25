import { expect, test } from '@playwright/test'
import { gotoHydrated, makeAccount, register } from './helpers'

test.describe('product pages', () => {
  test('the authenticated pages render for a new user', async ({ page }) => {
    await register(page, makeAccount('pages'))

    await page.goto('/calendar')
    await expect(page.locator('#main').getByRole('heading', { name: /\w+ \d{4}/ })).toBeVisible()

    await page.goto('/analytics')
    await expect(page.locator('#main h1')).toHaveText('Focus Orbit')
    await expect(page.getByTestId('focus-orbit-locked')).toBeVisible()

    await page.goto('/profile')
    await expect(
      page.locator('#main').getByRole('heading', { name: 'Profile', exact: true })
    ).toBeVisible()

    await page.goto('/settings')
    await expect(
      page.locator('#main').getByRole('heading', { name: 'Settings', exact: true })
    ).toBeVisible()
  })

  test('a user can update their display name', async ({ page }) => {
    await register(page, makeAccount('profile'))
    await gotoHydrated(page, '/profile')

    await page.getByTestId('profile-name').fill('Renamed Person')
    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/auth/profile')
          && r.request().method() === 'PATCH'
          && r.ok()
      ),
      page.getByTestId('profile-save').click()
    ])

    await expect(page.getByTestId('profile-name')).toHaveValue('Renamed Person')
    await expect(page.locator('#main').getByText('Renamed Person').first()).toBeVisible()
  })

  test('a user can change the theme preference', async ({ page }) => {
    await register(page, makeAccount('settings'))
    await gotoHydrated(page, '/settings')

    await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/api/auth/preferences')
          && r.request().method() === 'PATCH'
          && r.ok()
      ),
      page.getByTestId('theme-select').selectOption('dark')
    ])

    await expect(page.locator('html')).toHaveClass(/dark/)
  })
})

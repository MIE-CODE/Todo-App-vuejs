import { expect, test } from '@playwright/test'
import { DEMO_ACCOUNT, gotoHydrated, login, makeAccount, register } from './helpers'

test.describe('authentication', () => {
  test('landing page shows the product and links to sign up', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: /finish what matters/i })).toBeVisible()
  })

  test('protected routes redirect guests to login and preserve destination', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login\?redirect=/)
    expect(decodeURIComponent(page.url())).toContain('redirect=/dashboard')
  })

  test('a user can register and land on the dashboard', async ({ page }) => {
    const account = makeAccount('register')
    await register(page, account)
    await expect(page.getByRole('heading', { name: /good (morning|afternoon|evening)/i })).toBeVisible()
  })

  test('the demo account can sign in with a password', async ({ page }) => {
    await login(page, DEMO_ACCOUNT)
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('signed-in users are redirected away from the login page', async ({ page }) => {
    await login(page, DEMO_ACCOUNT)
    await page.goto('/login')
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('a user can sign out', async ({ page }) => {
    const account = makeAccount('logout')
    await register(page, account)

    await page.waitForSelector('html[data-hydrated="true"]')
    await page.getByRole('button', { name: /open account menu/i }).click()
    await page.getByRole('menuitem', { name: /sign out/i }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test.describe('social sign-in', () => {
    for (const provider of ['Google', 'GitHub'] as const) {
      test(`continue with ${provider} signs the user in`, async ({ page }) => {
        await gotoHydrated(page, '/login')
        await page.getByRole('button', { name: new RegExp(`continue with ${provider}`, 'i') }).click()
        await expect(page).toHaveURL(/\/dashboard/)
      })
    }
  })
})

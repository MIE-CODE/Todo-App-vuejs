import { expect, type Page } from '@playwright/test'

export interface TestAccount {
  name: string
  email: string
  password: string
}

/** Creates a unique test account and registers it through the UI. */
export function makeAccount(prefix = 'user'): TestAccount {
  const unique = `${Date.now()}${Math.floor(Math.random() * 10_000)}`
  return {
    name: 'Test Person',
    email: `${prefix}.${unique}@example.com`,
    password: 'Secret123'
  }
}

/** Navigates and waits for client hydration so form handlers are attached. */
export async function gotoHydrated(page: Page, path: string): Promise<void> {
  await page.goto(path)
  await page.waitForSelector('html[data-hydrated="true"]')
}

export async function register(page: Page, account: TestAccount): Promise<void> {
  await gotoHydrated(page, '/register')
  await page.getByTestId('register-name').fill(account.name)
  await page.getByTestId('register-email').fill(account.email)
  await page.getByTestId('register-password').fill(account.password)
  await page.getByTestId('register-submit').click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export async function login(page: Page, account: TestAccount): Promise<void> {
  await gotoHydrated(page, '/login')
  await page.getByTestId('login-email').fill(account.email)
  await page.getByTestId('login-password').fill(account.password)
  await page.getByTestId('login-submit').click()
  await expect(page).toHaveURL(/\/dashboard/)
}

export const DEMO_ACCOUNT: TestAccount = {
  name: 'Demo User',
  email: 'demo@taskflow.app',
  password: 'Demo123!pass'
}

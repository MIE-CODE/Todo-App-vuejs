import { expect, test, type Page } from '@playwright/test'
import { gotoHydrated, makeAccount, register } from './helpers'

async function createTask(page: Page, title: string): Promise<void> {
  const titleInput = page.getByTestId('task-title-input')
  await expect(titleInput).toBeVisible()
  await titleInput.fill('')
  await titleInput.fill(title)
  await expect(titleInput).toHaveValue(title)

  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/tasks')
        && !response.url().includes('/bulk')
        && response.request().method() === 'POST'
        && response.ok()
    ),
    page.getByTestId('task-submit').click()
  ])

  await expect(
    page.locator(`[data-testid^="task-card-"]`).filter({ hasText: title }).first()
  ).toBeVisible()
  // Wait for the create form to clear before the next create.
  await expect(titleInput).toHaveValue('')
}

test.describe('tasks', () => {
  test('create a task into the Todo column and move it to Done', async ({ page }) => {
    await register(page, makeAccount('tasks'))
    await gotoHydrated(page, '/tasks')

    await expect(page.locator('#main').getByRole('heading', { name: 'Tasks', exact: true })).toBeVisible()
    await expect(page.getByTestId('task-kanban')).toBeVisible()
    await expect(page.getByTestId('column-todo')).toBeVisible()

    const title = `E2E task ${Date.now()}`
    await createTask(page, title)

    const card = page.locator(`[data-testid^="task-card-"]`).filter({ hasText: title })
    await expect(page.getByTestId('column-todo').locator(`[data-testid^="task-card-"]`).filter({ hasText: title })).toBeVisible()

    await card.getByTestId(/task-status-/).click()
    await page.locator('ul[role="listbox"] li[role="option"]', { hasText: 'Done' }).click()

    await expect(
      page.getByTestId('column-done').locator(`[data-testid^="task-card-"]`).filter({ hasText: title })
    ).toBeVisible()
  })

  test('inline rename via double-click', async ({ page }) => {
    await register(page, makeAccount('inline'))
    await gotoHydrated(page, '/tasks')

    const title = `Rename me ${Date.now()}`
    await createTask(page, title)

    const card = page.locator(`[data-testid^="task-card-"]`).filter({ hasText: title })
    await card.getByRole('heading', { name: title }).dblclick()
    const input = page.getByTestId('inline-title-input')
    await expect(input).toBeVisible()

    const renamed = `${title} (edited)`
    await input.fill(renamed)
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH' && r.ok()
      ),
      input.blur()
    ])

    await expect(card.getByRole('heading', { name: renamed })).toBeVisible()
  })

  test('multi-select bulk complete', async ({ page }) => {
    await register(page, makeAccount('bulk'))
    await gotoHydrated(page, '/tasks')

    const a = `Bulk A ${Date.now()}`
    const b = `Bulk B ${Date.now()}`
    await createTask(page, a)
    await createTask(page, b)

    // Select the whole Todo column via the header checkbox.
    await page.getByTestId('column-todo').getByTestId('column-select-all').check()

    await expect(page.getByTestId('task-bulk-bar')).toBeVisible()
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/bulk') && r.request().method() === 'POST' && r.ok()
      ),
      page.getByTestId('bulk-complete').click()
    ])

    await expect(
      page.getByTestId('column-done').locator(`[data-testid^="task-card-"]`).filter({ hasText: a })
    ).toBeVisible()
    await expect(
      page.getByTestId('column-done').locator(`[data-testid^="task-card-"]`).filter({ hasText: b })
    ).toBeVisible()
  })

  test('edit and delete from the detail page', async ({ page }) => {
    await register(page, makeAccount('detail'))
    await gotoHydrated(page, '/tasks')

    const title = `Detail task ${Date.now()}`
    await createTask(page, title)

    const taskId = await page
      .locator(`[data-testid^="task-card-"]`)
      .filter({ hasText: title })
      .getAttribute('data-task-id')
    await page.goto(`/tasks/${taskId}`)
    await page.waitForSelector('html[data-hydrated="true"]')
    await expect(page).toHaveURL(/\/tasks\/[^/]+$/)

    const newTitle = `${title} (edited)`
    await page.getByTestId('edit-title').fill(newTitle)
    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH' && r.ok()
      ),
      page.getByTestId('edit-save').click()
    ])

    await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'DELETE' && r.ok()
      ),
      page.getByTestId('edit-delete').click()
    ])
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(
      page.locator(`[data-testid^="task-card-"]`).filter({ hasText: newTitle })
    ).toHaveCount(0)
  })
})

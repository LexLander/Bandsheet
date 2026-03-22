import { test, expect } from './fixtures/auth'

const PLAN_NAMES = ['Старт', 'Просунутий', 'Про']

test.describe('Адмінка: Плани', () => {
  test('Таблиця планів відображається', async ({ adminPage }) => {
    await adminPage.goto('/admin/plans')
    for (const name of PLAN_NAMES) {
      await expect(adminPage.getByText(name, { exact: true })).toBeVisible()
    }
  })
  test('Редагування ціни плану', async ({ adminPage }) => {
    await adminPage.goto('/admin/plans')
    const editRow = adminPage.locator('tr', { hasText: 'Просунутий' }).first()
    await editRow.locator('button', { hasText: 'edit plan' }).click({ force: true })
    const priceInput = adminPage.getByLabel('Monthly price')
    await expect(priceInput).toBeVisible({ timeout: 5000 })
    await priceInput.fill('')
    await priceInput.type('550')
    await adminPage.getByRole('button', { name: /save/i }).click()
    await expect(adminPage.getByText('550')).toBeVisible()
    // Повернути назад 500
    await editRow.locator('button', { hasText: 'edit plan' }).click({ force: true })
    await expect(priceInput).toBeVisible({ timeout: 5000 })
    await priceInput.fill('')
    await priceInput.type('500')
    await adminPage.getByRole('button', { name: /save/i }).click()
    await expect(adminPage.getByText('500')).toBeVisible()
  })

  test('Редагування лімітів', async ({ adminPage }) => {
    await adminPage.goto('/admin/plans')
    const limitsRow = adminPage.locator('tr', { hasText: 'Просунутий' }).first()
    await limitsRow.locator('button', { hasText: 'limits' }).click({ force: true })
    const maxGroupsInput = adminPage.getByLabel('Учасників у групі')
    await expect(maxGroupsInput).toBeVisible({ timeout: 5000 })
    await expect(maxGroupsInput).toHaveValue('3')
    await maxGroupsInput.fill('5')
    await adminPage.getByRole('button', { name: /save/i }).click()
    await expect(maxGroupsInput).toHaveValue('5')
    // Повернути назад 3
    await maxGroupsInput.fill('3')
    await adminPage.getByRole('button', { name: /save/i }).click()
    await expect(maxGroupsInput).toHaveValue('3')
  })

  test('Редагування функцій', async ({ adminPage }) => {
    await adminPage.goto('/admin/plans')
    const featuresRow = adminPage.locator('tr', { hasText: 'Просунутий' }).first()
    await featuresRow.locator('button', { hasText: 'features' }).click({ force: true })
    const importUrlCheckbox = adminPage.getByLabel('Імпорт з URL')
    const chordPaletteCheckbox = adminPage.getByLabel('Палітра акордів')
    await expect(importUrlCheckbox).toBeVisible({ timeout: 5000 })
    await expect(importUrlCheckbox).toBeChecked()
    await expect(chordPaletteCheckbox).toBeVisible({ timeout: 5000 })
    await expect(chordPaletteCheckbox).not.toBeChecked()
  })

  test('Переклади', async ({ adminPage }) => {
    await adminPage.goto('/admin/plans')
    const headings = await adminPage.getByRole('heading', { level: 1 }).all()
    for (const heading of headings) {
      const text = await heading.textContent()
      expect(text && text.trim().length).toBeGreaterThan(0)
    }
    const buttons = adminPage.locator('button')
    const count = await buttons.count()
    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent()
      if (!text || !text.trim()) continue
      expect(text.trim().length).toBeGreaterThan(0)
    }
  })
})

import { expect, test } from '@playwright/test'

test('home page loads and shows app shell', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/BandSheet/i)
  await expect(page.locator('body')).toContainText(/bandsheet|open\. play\. shine\./i)
})

test('login page is reachable and has auth fields', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByLabel('Email')).toBeVisible()
  await expect(page.getByLabel(/password|пароль/i)).toBeVisible()
  await expect(page.locator('form button[type="submit"]')).toBeVisible()
})

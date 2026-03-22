import { test as base, Page } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const test = base.extend<{ adminPage: Page }>({
  adminPage: async ({ page }, run) => {
    // 1. Логін через Supabase API
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: process.env.TEST_ADMIN_EMAIL!,
      password: process.env.TEST_ADMIN_PASSWORD!,
    })

    if (error || !data.session) {
      throw new Error(`Supabase login failed: ${error?.message}`)
    }

    // 2. Встановити auth cookie для SSR
    const cookieName = `sb-${process.env
      .NEXT_PUBLIC_SUPABASE_URL!.replace('https://', '')
      .replace('.supabase.co', '')}-auth-token`

    await page.context().addCookies([
      {
        name: cookieName,
        value: JSON.stringify(data.session),
        domain: '127.0.0.1',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ])

    // 3. Встановити localStorage supabase.auth.token
    await page.goto('/login')
    await page.evaluate((session) => {
      localStorage.setItem('supabase.auth.token', JSON.stringify(session))
    }, data.session)

    // 4. Перейти на /admin/plans и дождаться редиректа
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' })
    await page.waitForURL((url) => url.pathname.includes('/admin'), { timeout: 15000 })

    // 5. Если verify-device — пройти его
    if (page.url().includes('verify-device')) {
      await page.screenshot({ path: 'test-results/debug-verify-device.png' })
      // Найти форму по input[name="code"]
      const form = await page.locator('form:has(input[name="code"])').first()
      await form.locator('input[name="code"]').fill(process.env.ADMIN_2FA_CODE || '123456')
      await form.locator('button[type="submit"]').click()
      // Явно ждать либо редиректа, либо появления ошибки, либо 5 секунд
      try {
        await Promise.race([
          page.waitForURL((url) => !url.pathname.includes('verify-device'), { timeout: 5000 }),
          page.locator('.text-red-700').first().waitFor({ timeout: 5000 }),
        ])
      } catch {}
      // Лог после попытки submit
      const afterCookies = await page.context().cookies()
      console.warn('Cookies after verify-device:')
      afterCookies.forEach((c) => console.warn(` ${c.name} = ${c.value.substring(0, 50)}...`))
      console.warn('URL after verify-device:', page.url())
      // Лог текста ошибки (если есть)
      const errorText = await page
        .locator('.text-red-700')
        .first()
        .textContent()
        .catch(() => null)
      if (errorText) console.warn('Verify-device error:', errorText.trim())
      await page.screenshot({ path: 'test-results/debug-after-verify-device.png' })
    }

    // 6. Перейти на целевую страницу
    await page.goto('/admin/plans', { waitUntil: 'domcontentloaded' })
    await page.waitForSelector('text=Старт')

    const cookies = await page.context().cookies()
    console.warn('Cookies after API+localStorage login:')
    cookies.forEach((c) => console.warn(` ${c.name} = ${c.value.substring(0, 50)}...`))
    console.warn('Final URL:', page.url())
    await page.screenshot({ path: 'test-results/debug-auth-cookie.png' })

    // 7. Проверить что не на /login
    const url = page.url()
    if (url.includes('/login')) {
      console.warn('Still on login after API+localStorage auth.')
      throw new Error('Auth failed — redirected to login')
    }

    await run(page)
  },
})

export { expect } from '@playwright/test'

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const { t } = useLanguage()
  const { appName, appSlogan } = useSiteSettings()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError(t.auth.passwordTooShort)
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t.auth.passwordsDoNotMatch)
      return
    }

    setLoading(true)
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight">{appName}</h1>
          <p className="text-sm text-foreground/60 mt-1">{appSlogan}</p>
        </div>

        <div className="bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold mb-6">{t.auth.updatePasswordTitle}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="new-password">
                {t.auth.newPassword}
              </label>
              <input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" htmlFor="confirm-password">
                {t.auth.confirmPassword}
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? t.auth.savingPassword : t.auth.savePassword}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

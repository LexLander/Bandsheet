'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

export default function NewGroupPage() {
  const { t } = useLanguage()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await createGroup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground mb-6 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
        {t.groups.back}
      </button>

      <h1 className="text-2xl font-bold mb-6">{t.groups.newTitle}</h1>

      <form action={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5" htmlFor="name">
            {t.groups.groupName}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
            placeholder={t.groups.groupNamePlaceholder}
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {loading ? t.groups.creating : t.groups.createSubmit}
        </button>
      </form>
    </div>
  )
}

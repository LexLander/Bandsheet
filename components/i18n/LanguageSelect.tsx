'use client'

import { useRouter } from 'next/navigation'
import { Locale } from '@/lib/i18n/translations'
import { useLanguage } from './LanguageProvider'

export default function LanguageSelect() {
  const { locale, setLocale, languages } = useLanguage()
  const router = useRouter()

  async function handleChange(next: Locale) {
    setLocale(next)
    try {
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: { locale: next } }),
      })
    } catch {
      // locale still saved in localStorage/cookie
    }
    router.refresh()
  }

  return (
    <div className="px-3 py-1.5">
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="w-full bg-transparent text-sm text-foreground/75 cursor-pointer focus:outline-none hover:text-foreground transition-colors"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>{lang.name}</option>
        ))}
      </select>
    </div>
  )
}

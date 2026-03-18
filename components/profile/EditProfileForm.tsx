"use client"

import { useState } from 'react'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type Settings = {
  theme?: 'system' | 'light' | 'dark'
  compact?: boolean
  showTimestamps?: boolean
}

type ProfileFormData = {
  bio?: string | null
  email?: string | null
  settings?: Settings | null
}

const defaultSettings: Settings = {
  theme: 'system',
  compact: false,
  showTimestamps: true,
}

export default function EditProfileForm({ initialProfile }: { initialProfile: ProfileFormData }) {
  const { t } = useLanguage()
  const [saving, setSaving] = useState(false)
  const [bio, setBio] = useState(initialProfile.bio ?? '')
  const [email] = useState(initialProfile.email ?? '')
  const [settings, setSettings] = useState<Settings>(initialProfile.settings ?? defaultSettings)
  const [message, setMessage] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, settings }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setMessage(t.profile.saved)
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : '❌')
    } finally {
      setSaving(false)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium">{t.profile.email}</label>
        <div className="mt-1 text-sm text-muted-foreground">{email}</div>
      </div>

      <div>
        <label className="block text-sm font-medium">{t.profile.bio}</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={6}
          className="w-full rounded border p-2"
          maxLength={1000}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{t.profile.interfaceSettings}</legend>

        <div className="flex items-center space-x-3">
          <label className="text-sm">{t.profile.theme}</label>
          <select
            value={settings.theme}
            onChange={(e) => setSettings({ ...settings, theme: e.target.value as Settings['theme'] })}
            className="ml-2 rounded border p-1"
          >
            <option value="system">{t.profile.themeSystem}</option>
            <option value="light">{t.profile.themeLight}</option>
            <option value="dark">{t.profile.themeDark}</option>
          </select>
        </div>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={!!settings.compact}
            onChange={(e) => setSettings({ ...settings, compact: e.target.checked })}
          />
          <span className="text-sm">{t.profile.compactView}</span>
        </label>

        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={!!settings.showTimestamps}
            onChange={(e) => setSettings({ ...settings, showTimestamps: e.target.checked })}
          />
          <span className="text-sm">{t.profile.showTimestamps}</span>
        </label>
      </fieldset>

      <div className="flex items-center space-x-3">
        <button type="submit" disabled={saving} className="rounded bg-primary px-4 py-2 text-white">
          {saving ? t.profile.saving : t.profile.save}
        </button>
        {message && <div className="text-sm">{message}</div>}
      </div>
    </form>
  )
}


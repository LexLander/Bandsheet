'use client'

import { useMemo, useState } from 'react'
import type { SiteSettings } from '@/lib/db/settings'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type SectionId = 'general' | 'contacts' | 'registration' | 'maintenance' | 'ai'

type SaveResult = {
  success?: boolean
  error?: string
} & Partial<SiteSettings>

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback
  return value.trim().toLowerCase() === 'true'
}

function parseProvider(value: string | undefined) {
  return value === 'openai' ? 'openai' : 'anthropic'
}

type Props = {
  initialSettings: SiteSettings
}

// eslint-disable-next-line max-lines-per-function
export default function AdminSettingsClient({ initialSettings }: Props) {
  const { t } = useLanguage()

  const [activeSection, setActiveSection] = useState<SectionId>('general')
  const [savingSection, setSavingSection] = useState<SectionId | null>(null)
  const [savedSection, setSavedSection] = useState<SectionId | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [appName, setAppName] = useState(initialSettings.app_name)
  const [appSlogan, setAppSlogan] = useState(initialSettings.app_slogan)

  const [contactEmail, setContactEmail] = useState(initialSettings.contact_email)
  const [privacyUrl, setPrivacyUrl] = useState(initialSettings.privacy_url)
  const [termsUrl, setTermsUrl] = useState(initialSettings.terms_url)

  const [allowRegistration, setAllowRegistration] = useState(
    parseBoolean(initialSettings.allow_registration, true)
  )

  const [maintenanceEnabled, setMaintenanceEnabled] = useState(
    parseBoolean(initialSettings.maintenance_enabled, false)
  )
  const [maintenanceTitle, setMaintenanceTitle] = useState(initialSettings.maintenance_title)
  const [maintenanceMessage, setMaintenanceMessage] = useState(initialSettings.maintenance_message)
  const [maintenanceEta, setMaintenanceEta] = useState(initialSettings.maintenance_eta)

  const [aiProvider, setAiProvider] = useState<'anthropic' | 'openai'>(
    parseProvider(initialSettings.ai_provider)
  )
  const [apiKeyDraft, setApiKeyDraft] = useState('')
  const [maskedApiKey, setMaskedApiKey] = useState(initialSettings.ai_api_key)
  const [showApiKey, setShowApiKey] = useState(false)
  const [verifyState, setVerifyState] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle')

  const previewTitle = maintenanceTitle.trim() || "We'll be back soon"
  const previewMessage =
    maintenanceMessage.trim() || "We're updating the site and making improvements. Be right back."

  const verifyLabel = useMemo(() => {
    if (verifyState === 'checking') return t.profile.saving
    if (verifyState === 'valid') return t.admin.settings.verifyValid
    if (verifyState === 'invalid') return t.admin.settings.verifyInvalid
    return t.admin.settings.verify
  }, [t, verifyState])

  async function saveSection(section: SectionId, payload: Record<string, string | boolean>) {
    setSavingSection(section)
    setSavedSection(null)
    setError(null)

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = (await response.json().catch(() => ({}))) as SaveResult

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings')
      }

      if (typeof data.ai_api_key === 'string') {
        setMaskedApiKey(data.ai_api_key)
      }

      setSavedSection(section)
      window.dispatchEvent(new CustomEvent('site-settings-updated', { detail: data }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSavingSection(null)
    }
  }

  async function verifyApiKey() {
    const apiKey = apiKeyDraft.trim()
    if (!apiKey) {
      setVerifyState('invalid')
      return
    }

    setVerifyState('checking')

    try {
      const response = await fetch('/api/settings/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider: aiProvider, apiKey }),
      })

      const payload = (await response.json().catch(() => ({}))) as { valid?: boolean }
      setVerifyState(payload.valid ? 'valid' : 'invalid')
    } catch {
      setVerifyState('invalid')
    }
  }

  const isSaving = (section: SectionId) => savingSection === section
  const menuButtonClass = (section: SectionId) =>
    `w-full rounded-md px-3 py-2 text-left text-sm transition ${
      activeSection === section
        ? 'bg-black/10 dark:bg-white/10 font-medium'
        : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80'
    }`

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.admin.settings.title}</h2>
        <p className="text-sm text-foreground/60">{t.admin.settings.description}</p>
      </section>

      <div className="flex gap-8 items-start">
        <nav className="w-[220px] shrink-0 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-5">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">
              {t.admin.settings.menuSite}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection('general')}
                className={menuButtonClass('general')}
              >
                {t.admin.settings.general}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('contacts')}
                className={menuButtonClass('contacts')}
              >
                {t.admin.settings.contacts}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">
              {t.admin.settings.menuAccess}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection('registration')}
                className={menuButtonClass('registration')}
              >
                {t.admin.settings.registration}
              </button>
              <button
                type="button"
                onClick={() => setActiveSection('maintenance')}
                className={menuButtonClass('maintenance')}
              >
                {t.admin.settings.maintenance}
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">
              {t.admin.settings.menuIntegrations}
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => setActiveSection('ai')}
                className={menuButtonClass('ai')}
              >
                {t.admin.settings.aiTranslation}
              </button>
            </div>
          </div>
        </nav>

        <div className="min-w-0 flex-1 rounded-xl border border-black/10 dark:border-white/10 p-4 md:p-6">
          {activeSection === 'general' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void saveSection('general', {
                  app_name: appName,
                  app_slogan: appSlogan,
                })
              }}
            >
              <h3 className="text-lg font-semibold">{t.admin.settings.general}</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="app-name">
                  {t.admin.settings.appName}
                </label>
                <input
                  id="app-name"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="app-slogan">
                  {t.admin.settings.appSlogan}
                </label>
                <input
                  id="app-slogan"
                  value={appSlogan}
                  onChange={(e) => setAppSlogan(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving('general')}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {isSaving('general') ? t.profile.saving : t.admin.settings.save}
              </button>
            </form>
          )}

          {activeSection === 'contacts' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void saveSection('contacts', {
                  contact_email: contactEmail,
                  privacy_url: privacyUrl,
                  terms_url: termsUrl,
                })
              }}
            >
              <h3 className="text-lg font-semibold">{t.admin.settings.contacts}</h3>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="contact-email">
                  {t.admin.settings.contactEmail}
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="privacy-url">
                  {t.admin.settings.privacyUrl}
                </label>
                <input
                  id="privacy-url"
                  value={privacyUrl}
                  onChange={(e) => setPrivacyUrl(e.target.value)}
                  placeholder="https://example.com/privacy"
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="terms-url">
                  {t.admin.settings.termsUrl}
                </label>
                <input
                  id="terms-url"
                  value={termsUrl}
                  onChange={(e) => setTermsUrl(e.target.value)}
                  placeholder="https://example.com/terms"
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>
              <button
                type="submit"
                disabled={isSaving('contacts')}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {isSaving('contacts') ? t.profile.saving : t.admin.settings.save}
              </button>
            </form>
          )}

          {activeSection === 'registration' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void saveSection('registration', {
                  allow_registration: allowRegistration,
                })
              }}
            >
              <h3 className="text-lg font-semibold">{t.admin.settings.registration}</h3>
              <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={allowRegistration}
                  onChange={(e) => setAllowRegistration(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {t.admin.settings.allowRegistration}
                  </span>
                  <span className="block text-xs text-foreground/60">
                    {t.admin.settings.allowRegistrationHint}
                  </span>
                </span>
              </label>
              <button
                type="submit"
                disabled={isSaving('registration')}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {isSaving('registration') ? t.profile.saving : t.admin.settings.save}
              </button>
            </form>
          )}

          {activeSection === 'maintenance' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                void saveSection('maintenance', {
                  maintenance_enabled: maintenanceEnabled,
                  maintenance_title: maintenanceTitle,
                  maintenance_message: maintenanceMessage,
                  maintenance_eta: maintenanceEta,
                })
              }}
            >
              <h3 className="text-lg font-semibold">{t.admin.settings.maintenance}</h3>
              <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
                <input
                  type="checkbox"
                  checked={maintenanceEnabled}
                  onChange={(e) => setMaintenanceEnabled(e.target.checked)}
                  className="mt-1 h-4 w-4"
                />
                <span>
                  <span className="block text-sm font-medium">
                    {t.admin.settings.enableMaintenance}
                  </span>
                  <span className="block text-xs text-foreground/60">
                    {t.admin.settings.enableMaintenanceHint}
                  </span>
                </span>
              </label>

              {maintenanceEnabled && (
                <div className="rounded-lg border border-amber-400/70 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
                  {t.admin.settings.maintenanceWarning}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-title">
                  {t.admin.settings.maintenanceTitle}
                </label>
                <input
                  id="maintenance-title"
                  value={maintenanceTitle}
                  onChange={(e) => setMaintenanceTitle(e.target.value)}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-message">
                  {t.admin.settings.maintenanceMessage}
                </label>
                <textarea
                  id="maintenance-message"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-eta">
                  {t.admin.settings.maintenanceEta}
                </label>
                <input
                  id="maintenance-eta"
                  value={maintenanceEta}
                  onChange={(e) => setMaintenanceEta(e.target.value)}
                  placeholder={t.admin.settings.maintenanceEtaPlaceholder}
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                />
              </div>

              <div className="space-y-2 rounded-lg border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-xs uppercase tracking-wide text-foreground/60">
                  {t.admin.settings.preview}
                </p>
                <h4 className="text-lg font-semibold">{previewTitle}</h4>
                <p className="whitespace-pre-wrap text-sm text-foreground/80">{previewMessage}</p>
                {maintenanceEta.trim() && (
                  <p className="text-sm text-foreground/60">{maintenanceEta}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving('maintenance')}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {isSaving('maintenance') ? t.profile.saving : t.admin.settings.save}
              </button>
            </form>
          )}

          {activeSection === 'ai' && (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault()
                const payload: Record<string, string> = { ai_provider: aiProvider }
                const trimmedKey = apiKeyDraft.trim()
                if (trimmedKey) payload.ai_api_key = trimmedKey

                void saveSection('ai', payload).then(() => {
                  if (trimmedKey) {
                    setApiKeyDraft('')
                  }
                })
              }}
            >
              <h3 className="text-lg font-semibold">{t.admin.settings.aiTranslation}</h3>
              <p className="text-sm text-foreground/60">{t.admin.settings.aiHint}</p>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="ai-provider">
                  {t.admin.settings.aiProvider}
                </label>
                <select
                  id="ai-provider"
                  value={aiProvider}
                  onChange={(e) =>
                    setAiProvider(e.target.value === 'openai' ? 'openai' : 'anthropic')
                  }
                  className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                >
                  <option value="anthropic">{t.admin.settings.providerAnthropic}</option>
                  <option value="openai">{t.admin.settings.providerOpenai}</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium" htmlFor="ai-api-key">
                  {t.admin.settings.aiApiKey}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="ai-api-key"
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKeyDraft}
                    onChange={(e) => {
                      setApiKeyDraft(e.target.value)
                      if (verifyState !== 'idle') setVerifyState('idle')
                    }}
                    placeholder={maskedApiKey || 'sk-ant-...'}
                    className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((value) => !value)}
                    className="rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/15"
                  >
                    {showApiKey ? t.admin.settings.hide : t.admin.settings.show}
                  </button>
                  <button
                    type="button"
                    onClick={() => void verifyApiKey()}
                    disabled={verifyState === 'checking'}
                    className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/15 disabled:opacity-60"
                  >
                    {verifyState === 'checking' ? t.profile.saving : t.admin.settings.verify}
                  </button>
                </div>
                {maskedApiKey && (
                  <p className="mt-1 text-xs text-foreground/60">
                    {t.admin.settings.currentKey}: {maskedApiKey}
                  </p>
                )}
                {verifyState !== 'idle' && (
                  <p
                    className={`mt-2 text-sm ${verifyState === 'valid' ? 'text-emerald-600' : verifyState === 'invalid' ? 'text-red-600' : 'text-foreground/60'}`}
                  >
                    {verifyLabel}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSaving('ai')}
                className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
              >
                {isSaving('ai') ? t.profile.saving : t.admin.settings.save}
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {savedSection === activeSection && (
            <p className="mt-4 text-sm text-emerald-600">{t.admin.settings.saved}</p>
          )}
        </div>
      </div>
    </div>
  )
}

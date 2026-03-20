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

type SaveSectionFn = (
  section: SectionId,
  payload: Record<string, string | boolean>
) => Promise<void>

type SettingsMenuProps = {
  activeSection: SectionId
  onSectionChange: (section: SectionId) => void
  menuSite: string
  menuAccess: string
  menuIntegrations: string
  general: string
  contacts: string
  registration: string
  maintenance: string
  aiTranslation: string
}

type GeneralSectionProps = {
  title: string
  appNameLabel: string
  appSloganLabel: string
  appName: string
  appSlogan: string
  setAppName: (value: string) => void
  setAppSlogan: (value: string) => void
  isSaving: boolean
  savingLabel: string
  saveLabel: string
  saveSection: SaveSectionFn
}

type ContactsSectionProps = {
  title: string
  contactEmailLabel: string
  privacyUrlLabel: string
  termsUrlLabel: string
  contactEmail: string
  privacyUrl: string
  termsUrl: string
  setContactEmail: (value: string) => void
  setPrivacyUrl: (value: string) => void
  setTermsUrl: (value: string) => void
  isSaving: boolean
  savingLabel: string
  saveLabel: string
  saveSection: SaveSectionFn
}

type RegistrationSectionProps = {
  title: string
  allowRegistrationLabel: string
  allowRegistrationHint: string
  allowRegistration: boolean
  setAllowRegistration: (value: boolean) => void
  isSaving: boolean
  savingLabel: string
  saveLabel: string
  saveSection: SaveSectionFn
}

type MaintenanceSectionProps = {
  title: string
  enableMaintenanceLabel: string
  enableMaintenanceHint: string
  maintenanceWarning: string
  maintenanceTitleLabel: string
  maintenanceMessageLabel: string
  maintenanceEtaLabel: string
  maintenanceEtaPlaceholder: string
  previewLabel: string
  maintenanceEnabled: boolean
  setMaintenanceEnabled: (value: boolean) => void
  maintenanceTitle: string
  setMaintenanceTitle: (value: string) => void
  maintenanceMessage: string
  setMaintenanceMessage: (value: string) => void
  maintenanceEta: string
  setMaintenanceEta: (value: string) => void
  previewTitle: string
  previewMessage: string
  isSaving: boolean
  savingLabel: string
  saveLabel: string
  saveSection: SaveSectionFn
}

type AiSectionProps = {
  title: string
  hint: string
  providerLabel: string
  providerAnthropicLabel: string
  providerOpenaiLabel: string
  apiKeyLabel: string
  currentKeyLabel: string
  hideLabel: string
  showLabel: string
  verifyLabel: string
  savingLabel: string
  saveLabel: string
  aiProvider: 'anthropic' | 'openai'
  setAiProvider: (value: 'anthropic' | 'openai') => void
  apiKeyDraft: string
  setApiKeyDraft: (value: string) => void
  maskedApiKey: string
  showApiKey: boolean
  setShowApiKey: (value: boolean) => void
  verifyState: 'idle' | 'checking' | 'valid' | 'invalid'
  setVerifyState: (value: 'idle' | 'checking' | 'valid' | 'invalid') => void
  verifyApiKey: () => Promise<void>
  isSaving: boolean
  saveSection: SaveSectionFn
}

type AdminSettingsState = ReturnType<typeof useAdminSettingsState>
type SettingsTranslations = ReturnType<typeof useLanguage>['t']['admin']['settings']

function useAdminSettingsState(initialSettings: SiteSettings) {
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

  return {
    activeSection,
    setActiveSection,
    savedSection,
    error,
    appName,
    setAppName,
    appSlogan,
    setAppSlogan,
    contactEmail,
    setContactEmail,
    privacyUrl,
    setPrivacyUrl,
    termsUrl,
    setTermsUrl,
    allowRegistration,
    setAllowRegistration,
    maintenanceEnabled,
    setMaintenanceEnabled,
    maintenanceTitle,
    setMaintenanceTitle,
    maintenanceMessage,
    setMaintenanceMessage,
    maintenanceEta,
    setMaintenanceEta,
    aiProvider,
    setAiProvider,
    apiKeyDraft,
    setApiKeyDraft,
    maskedApiKey,
    showApiKey,
    setShowApiKey,
    verifyState,
    setVerifyState,
    saveSection,
    verifyApiKey,
    isSaving,
  }
}

function menuButtonClass(activeSection: SectionId, section: SectionId) {
  return `w-full rounded-md px-3 py-2 text-left text-sm transition ${
    activeSection === section
      ? 'bg-black/10 dark:bg-white/10 font-medium'
      : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80'
  }`
}

function SettingsMenu({
  activeSection,
  onSectionChange,
  menuSite,
  menuAccess,
  menuIntegrations,
  general,
  contacts,
  registration,
  maintenance,
  aiTranslation,
}: SettingsMenuProps) {
  return (
    <nav className="w-[220px] shrink-0 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 space-y-5">
      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{menuSite}</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSectionChange('general')}
            className={menuButtonClass(activeSection, 'general')}
          >
            {general}
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('contacts')}
            className={menuButtonClass(activeSection, 'contacts')}
          >
            {contacts}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">{menuAccess}</p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSectionChange('registration')}
            className={menuButtonClass(activeSection, 'registration')}
          >
            {registration}
          </button>
          <button
            type="button"
            onClick={() => onSectionChange('maintenance')}
            className={menuButtonClass(activeSection, 'maintenance')}
          >
            {maintenance}
          </button>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs uppercase tracking-wide text-foreground/50">
          {menuIntegrations}
        </p>
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => onSectionChange('ai')}
            className={menuButtonClass(activeSection, 'ai')}
          >
            {aiTranslation}
          </button>
        </div>
      </div>
    </nav>
  )
}

function GeneralSection({
  title,
  appNameLabel,
  appSloganLabel,
  appName,
  appSlogan,
  setAppName,
  setAppSlogan,
  isSaving,
  savingLabel,
  saveLabel,
  saveSection,
}: GeneralSectionProps) {
  return (
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
      <h3 className="text-lg font-semibold">{title}</h3>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="app-name">
          {appNameLabel}
        </label>
        <input
          id="app-name"
          value={appName}
          onChange={(event) => setAppName(event.target.value)}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="app-slogan">
          {appSloganLabel}
        </label>
        <input
          id="app-slogan"
          value={appSlogan}
          onChange={(event) => setAppSlogan(event.target.value)}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </form>
  )
}

function ContactsSection({
  title,
  contactEmailLabel,
  privacyUrlLabel,
  termsUrlLabel,
  contactEmail,
  privacyUrl,
  termsUrl,
  setContactEmail,
  setPrivacyUrl,
  setTermsUrl,
  isSaving,
  savingLabel,
  saveLabel,
  saveSection,
}: ContactsSectionProps) {
  return (
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
      <h3 className="text-lg font-semibold">{title}</h3>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="contact-email">
          {contactEmailLabel}
        </label>
        <input
          id="contact-email"
          type="email"
          value={contactEmail}
          onChange={(event) => setContactEmail(event.target.value)}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="privacy-url">
          {privacyUrlLabel}
        </label>
        <input
          id="privacy-url"
          value={privacyUrl}
          onChange={(event) => setPrivacyUrl(event.target.value)}
          placeholder="https://example.com/privacy"
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="terms-url">
          {termsUrlLabel}
        </label>
        <input
          id="terms-url"
          value={termsUrl}
          onChange={(event) => setTermsUrl(event.target.value)}
          placeholder="https://example.com/terms"
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </form>
  )
}

function RegistrationSection({
  title,
  allowRegistrationLabel,
  allowRegistrationHint,
  allowRegistration,
  setAllowRegistration,
  isSaving,
  savingLabel,
  saveLabel,
  saveSection,
}: RegistrationSectionProps) {
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault()
        void saveSection('registration', {
          allow_registration: allowRegistration,
        })
      }}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
        <input
          type="checkbox"
          checked={allowRegistration}
          onChange={(event) => setAllowRegistration(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-medium">{allowRegistrationLabel}</span>
          <span className="block text-xs text-foreground/60">{allowRegistrationHint}</span>
        </span>
      </label>
      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </form>
  )
}

function MaintenanceSection({
  title,
  enableMaintenanceLabel,
  enableMaintenanceHint,
  maintenanceWarning,
  maintenanceTitleLabel,
  maintenanceMessageLabel,
  maintenanceEtaLabel,
  maintenanceEtaPlaceholder,
  previewLabel,
  maintenanceEnabled,
  setMaintenanceEnabled,
  maintenanceTitle,
  setMaintenanceTitle,
  maintenanceMessage,
  setMaintenanceMessage,
  maintenanceEta,
  setMaintenanceEta,
  previewTitle,
  previewMessage,
  isSaving,
  savingLabel,
  saveLabel,
  saveSection,
}: MaintenanceSectionProps) {
  return (
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
      <h3 className="text-lg font-semibold">{title}</h3>
      <label className="flex items-start gap-3 rounded-lg border border-black/10 p-3 dark:border-white/10">
        <input
          type="checkbox"
          checked={maintenanceEnabled}
          onChange={(event) => setMaintenanceEnabled(event.target.checked)}
          className="mt-1 h-4 w-4"
        />
        <span>
          <span className="block text-sm font-medium">{enableMaintenanceLabel}</span>
          <span className="block text-xs text-foreground/60">{enableMaintenanceHint}</span>
        </span>
      </label>

      {maintenanceEnabled ? (
        <div className="rounded-lg border border-amber-400/70 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:bg-amber-950/20 dark:text-amber-200">
          {maintenanceWarning}
        </div>
      ) : null}

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-title">
          {maintenanceTitleLabel}
        </label>
        <input
          id="maintenance-title"
          value={maintenanceTitle}
          onChange={(event) => setMaintenanceTitle(event.target.value)}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-message">
          {maintenanceMessageLabel}
        </label>
        <textarea
          id="maintenance-message"
          value={maintenanceMessage}
          onChange={(event) => setMaintenanceMessage(event.target.value)}
          rows={4}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="maintenance-eta">
          {maintenanceEtaLabel}
        </label>
        <input
          id="maintenance-eta"
          value={maintenanceEta}
          onChange={(event) => setMaintenanceEta(event.target.value)}
          placeholder={maintenanceEtaPlaceholder}
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        />
      </div>

      <div className="space-y-2 rounded-lg border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.03]">
        <p className="text-xs uppercase tracking-wide text-foreground/60">{previewLabel}</p>
        <h4 className="text-lg font-semibold">{previewTitle}</h4>
        <p className="whitespace-pre-wrap text-sm text-foreground/80">{previewMessage}</p>
        {maintenanceEta.trim() ? (
          <p className="text-sm text-foreground/60">{maintenanceEta}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </form>
  )
}

function AiSection({
  title,
  hint,
  providerLabel,
  providerAnthropicLabel,
  providerOpenaiLabel,
  apiKeyLabel,
  currentKeyLabel,
  hideLabel,
  showLabel,
  verifyLabel,
  savingLabel,
  saveLabel,
  aiProvider,
  setAiProvider,
  apiKeyDraft,
  setApiKeyDraft,
  maskedApiKey,
  showApiKey,
  setShowApiKey,
  verifyState,
  setVerifyState,
  verifyApiKey,
  isSaving,
  saveSection,
}: AiSectionProps) {
  return (
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
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-foreground/60">{hint}</p>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="ai-provider">
          {providerLabel}
        </label>
        <select
          id="ai-provider"
          value={aiProvider}
          onChange={(event) =>
            setAiProvider(event.target.value === 'openai' ? 'openai' : 'anthropic')
          }
          className="w-full rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
        >
          <option value="anthropic">{providerAnthropicLabel}</option>
          <option value="openai">{providerOpenaiLabel}</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium" htmlFor="ai-api-key">
          {apiKeyLabel}
        </label>
        <div className="flex items-center gap-2">
          <input
            id="ai-api-key"
            type={showApiKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={(event) => {
              setApiKeyDraft(event.target.value)
              if (verifyState !== 'idle') setVerifyState('idle')
            }}
            placeholder={maskedApiKey || 'sk-ant-...'}
            className="min-w-0 flex-1 rounded-lg border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="rounded-lg border border-black/15 px-3 py-2 text-sm dark:border-white/15"
          >
            {showApiKey ? hideLabel : showLabel}
          </button>
          <button
            type="button"
            onClick={() => void verifyApiKey()}
            disabled={verifyState === 'checking'}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium dark:border-white/15 disabled:opacity-60"
          >
            {verifyState === 'checking' ? savingLabel : verifyLabel}
          </button>
        </div>
        {maskedApiKey ? (
          <p className="mt-1 text-xs text-foreground/60">
            {currentKeyLabel}: {maskedApiKey}
          </p>
        ) : null}
        {verifyState !== 'idle' ? (
          <p
            className={`mt-2 text-sm ${
              verifyState === 'valid'
                ? 'text-emerald-600'
                : verifyState === 'invalid'
                  ? 'text-red-600'
                  : 'text-foreground/60'
            }`}
          >
            {verifyLabel}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSaving}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
      >
        {isSaving ? savingLabel : saveLabel}
      </button>
    </form>
  )
}

type SettingsPanelProps = {
  state: AdminSettingsState
  settingsT: SettingsTranslations
  savingLabel: string
  verifyLabel: string
  previewTitle: string
  previewMessage: string
}

function renderGeneralSection(
  state: AdminSettingsState,
  settingsT: SettingsTranslations,
  savingLabel: string
) {
  return (
    <GeneralSection
      title={settingsT.general}
      appNameLabel={settingsT.appName}
      appSloganLabel={settingsT.appSlogan}
      appName={state.appName}
      appSlogan={state.appSlogan}
      setAppName={state.setAppName}
      setAppSlogan={state.setAppSlogan}
      isSaving={state.isSaving('general')}
      savingLabel={savingLabel}
      saveLabel={settingsT.save}
      saveSection={state.saveSection}
    />
  )
}

function renderContactsSection(
  state: AdminSettingsState,
  settingsT: SettingsTranslations,
  savingLabel: string
) {
  return (
    <ContactsSection
      title={settingsT.contacts}
      contactEmailLabel={settingsT.contactEmail}
      privacyUrlLabel={settingsT.privacyUrl}
      termsUrlLabel={settingsT.termsUrl}
      contactEmail={state.contactEmail}
      privacyUrl={state.privacyUrl}
      termsUrl={state.termsUrl}
      setContactEmail={state.setContactEmail}
      setPrivacyUrl={state.setPrivacyUrl}
      setTermsUrl={state.setTermsUrl}
      isSaving={state.isSaving('contacts')}
      savingLabel={savingLabel}
      saveLabel={settingsT.save}
      saveSection={state.saveSection}
    />
  )
}

function renderRegistrationSection(
  state: AdminSettingsState,
  settingsT: SettingsTranslations,
  savingLabel: string
) {
  return (
    <RegistrationSection
      title={settingsT.registration}
      allowRegistrationLabel={settingsT.allowRegistration}
      allowRegistrationHint={settingsT.allowRegistrationHint}
      allowRegistration={state.allowRegistration}
      setAllowRegistration={state.setAllowRegistration}
      isSaving={state.isSaving('registration')}
      savingLabel={savingLabel}
      saveLabel={settingsT.save}
      saveSection={state.saveSection}
    />
  )
}

function renderMaintenanceSection(
  state: AdminSettingsState,
  settingsT: SettingsTranslations,
  savingLabel: string,
  previewTitle: string,
  previewMessage: string
) {
  return (
    <MaintenanceSection
      title={settingsT.maintenance}
      enableMaintenanceLabel={settingsT.enableMaintenance}
      enableMaintenanceHint={settingsT.enableMaintenanceHint}
      maintenanceWarning={settingsT.maintenanceWarning}
      maintenanceTitleLabel={settingsT.maintenanceTitle}
      maintenanceMessageLabel={settingsT.maintenanceMessage}
      maintenanceEtaLabel={settingsT.maintenanceEta}
      maintenanceEtaPlaceholder={settingsT.maintenanceEtaPlaceholder}
      previewLabel={settingsT.preview}
      maintenanceEnabled={state.maintenanceEnabled}
      setMaintenanceEnabled={state.setMaintenanceEnabled}
      maintenanceTitle={state.maintenanceTitle}
      setMaintenanceTitle={state.setMaintenanceTitle}
      maintenanceMessage={state.maintenanceMessage}
      setMaintenanceMessage={state.setMaintenanceMessage}
      maintenanceEta={state.maintenanceEta}
      setMaintenanceEta={state.setMaintenanceEta}
      previewTitle={previewTitle}
      previewMessage={previewMessage}
      isSaving={state.isSaving('maintenance')}
      savingLabel={savingLabel}
      saveLabel={settingsT.save}
      saveSection={state.saveSection}
    />
  )
}

function renderAiSection(
  state: AdminSettingsState,
  settingsT: SettingsTranslations,
  savingLabel: string,
  verifyLabel: string
) {
  return (
    <AiSection
      title={settingsT.aiTranslation}
      hint={settingsT.aiHint}
      providerLabel={settingsT.aiProvider}
      providerAnthropicLabel={settingsT.providerAnthropic}
      providerOpenaiLabel={settingsT.providerOpenai}
      apiKeyLabel={settingsT.aiApiKey}
      currentKeyLabel={settingsT.currentKey}
      hideLabel={settingsT.hide}
      showLabel={settingsT.show}
      verifyLabel={verifyLabel}
      savingLabel={savingLabel}
      saveLabel={settingsT.save}
      aiProvider={state.aiProvider}
      setAiProvider={state.setAiProvider}
      apiKeyDraft={state.apiKeyDraft}
      setApiKeyDraft={state.setApiKeyDraft}
      maskedApiKey={state.maskedApiKey}
      showApiKey={state.showApiKey}
      setShowApiKey={state.setShowApiKey}
      verifyState={state.verifyState}
      setVerifyState={state.setVerifyState}
      verifyApiKey={state.verifyApiKey}
      isSaving={state.isSaving('ai')}
      saveSection={state.saveSection}
    />
  )
}

function SettingsPanel({
  state,
  settingsT,
  savingLabel,
  verifyLabel,
  previewTitle,
  previewMessage,
}: SettingsPanelProps) {
  switch (state.activeSection) {
    case 'general':
      return renderGeneralSection(state, settingsT, savingLabel)
    case 'contacts':
      return renderContactsSection(state, settingsT, savingLabel)
    case 'registration':
      return renderRegistrationSection(state, settingsT, savingLabel)
    case 'maintenance':
      return renderMaintenanceSection(state, settingsT, savingLabel, previewTitle, previewMessage)
    case 'ai':
      return renderAiSection(state, settingsT, savingLabel, verifyLabel)
    default:
      return null
  }
}

export default function AdminSettingsClient({ initialSettings }: Props) {
  const { t } = useLanguage()
  const state = useAdminSettingsState(initialSettings)

  const previewTitle = state.maintenanceTitle.trim() || "We'll be back soon"
  const previewMessage =
    state.maintenanceMessage.trim() ||
    "We're updating the site and making improvements. Be right back."

  const verifyLabel = useMemo(() => {
    if (state.verifyState === 'checking') return t.profile.saving
    if (state.verifyState === 'valid') return t.admin.settings.verifyValid
    if (state.verifyState === 'invalid') return t.admin.settings.verifyInvalid
    return t.admin.settings.verify
  }, [state.verifyState, t])

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.admin.settings.title}</h2>
        <p className="text-sm text-foreground/60">{t.admin.settings.description}</p>
      </section>

      <div className="flex gap-8 items-start">
        <SettingsMenu
          activeSection={state.activeSection}
          onSectionChange={state.setActiveSection}
          menuSite={t.admin.settings.menuSite}
          menuAccess={t.admin.settings.menuAccess}
          menuIntegrations={t.admin.settings.menuIntegrations}
          general={t.admin.settings.general}
          contacts={t.admin.settings.contacts}
          registration={t.admin.settings.registration}
          maintenance={t.admin.settings.maintenance}
          aiTranslation={t.admin.settings.aiTranslation}
        />

        <div className="min-w-0 flex-1 rounded-xl border border-black/10 dark:border-white/10 p-4 md:p-6">
          <SettingsPanel
            state={state}
            settingsT={t.admin.settings}
            savingLabel={t.profile.saving}
            verifyLabel={verifyLabel}
            previewTitle={previewTitle}
            previewMessage={previewMessage}
          />

          {state.error ? <p className="mt-4 text-sm text-red-600">{state.error}</p> : null}
          {state.savedSection === state.activeSection ? (
            <p className="mt-4 text-sm text-emerald-600">{t.admin.settings.saved}</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

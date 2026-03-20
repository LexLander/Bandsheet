import { useState } from 'react'
import type { SiteSettings } from '@/lib/db/settings'
import type { AdminSettingsState, AiProvider, SaveResult, SectionId } from './types'

function parseBoolean(value: string | undefined, fallback = false) {
  if (!value) return fallback
  return value.trim().toLowerCase() === 'true'
}

function parseProvider(value: string | undefined): AiProvider {
  return value === 'openai' ? 'openai' : 'anthropic'
}

export function useAdminSettingsState(initialSettings: SiteSettings): AdminSettingsState {
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
  const [aiProvider, setAiProvider] = useState<AiProvider>(
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

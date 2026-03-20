import type { useLanguage } from '@/components/i18n/LanguageProvider'
import type { SiteSettings } from '@/lib/db/settings'

export type SectionId = 'general' | 'contacts' | 'registration' | 'maintenance' | 'ai'
export type VerifyState = 'idle' | 'checking' | 'valid' | 'invalid'
export type AiProvider = 'anthropic' | 'openai'

export type Props = {
  initialSettings: SiteSettings
}

export type SaveResult = {
  success?: boolean
  error?: string
} & Partial<SiteSettings>

export type SaveSectionFn = (
  section: SectionId,
  payload: Record<string, string | boolean>
) => Promise<void>

export type AdminSettingsState = {
  activeSection: SectionId
  setActiveSection: (section: SectionId) => void
  savedSection: SectionId | null
  error: string | null
  appName: string
  setAppName: (value: string) => void
  appSlogan: string
  setAppSlogan: (value: string) => void
  contactEmail: string
  setContactEmail: (value: string) => void
  privacyUrl: string
  setPrivacyUrl: (value: string) => void
  termsUrl: string
  setTermsUrl: (value: string) => void
  allowRegistration: boolean
  setAllowRegistration: (value: boolean) => void
  maintenanceEnabled: boolean
  setMaintenanceEnabled: (value: boolean) => void
  maintenanceTitle: string
  setMaintenanceTitle: (value: string) => void
  maintenanceMessage: string
  setMaintenanceMessage: (value: string) => void
  maintenanceEta: string
  setMaintenanceEta: (value: string) => void
  aiProvider: AiProvider
  setAiProvider: (value: AiProvider) => void
  apiKeyDraft: string
  setApiKeyDraft: (value: string) => void
  maskedApiKey: string
  showApiKey: boolean
  setShowApiKey: (value: boolean) => void
  verifyState: VerifyState
  setVerifyState: (value: VerifyState) => void
  saveSection: SaveSectionFn
  verifyApiKey: () => Promise<void>
  isSaving: (section: SectionId) => boolean
}

export type SettingsTranslations = ReturnType<typeof useLanguage>['t']['admin']['settings']

export type SettingsMenuProps = {
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

export type GeneralSectionProps = {
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

export type ContactsSectionProps = {
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

export type RegistrationSectionProps = {
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

export type MaintenanceSectionProps = {
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

export type AiSectionProps = {
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
  aiProvider: AiProvider
  setAiProvider: (value: AiProvider) => void
  apiKeyDraft: string
  setApiKeyDraft: (value: string) => void
  maskedApiKey: string
  showApiKey: boolean
  setShowApiKey: (value: boolean) => void
  verifyState: VerifyState
  setVerifyState: (value: VerifyState) => void
  verifyApiKey: () => Promise<void>
  isSaving: boolean
  saveSection: SaveSectionFn
}

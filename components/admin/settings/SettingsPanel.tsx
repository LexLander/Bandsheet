import {
  AiSection,
  ContactsSection,
  GeneralSection,
  MaintenanceSection,
  RegistrationSection,
} from './SettingsSections'
import type { AdminSettingsState, SettingsTranslations } from './types'

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

export default function SettingsPanel({
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

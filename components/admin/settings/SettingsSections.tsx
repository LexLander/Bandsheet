import type {
  AiSectionProps,
  ContactsSectionProps,
  GeneralSectionProps,
  MaintenanceSectionProps,
  RegistrationSectionProps,
} from './types'

export function GeneralSection({
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

export function ContactsSection({
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

export function RegistrationSection({
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

export function MaintenanceSection({
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

export function AiSection({
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

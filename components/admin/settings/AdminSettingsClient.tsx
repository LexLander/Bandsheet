'use client'

import { useMemo } from 'react'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import SettingsMenu from './SettingsMenu'
import SettingsPanel from './SettingsPanel'
import type { Props } from './types'
import { useAdminSettingsState } from './useAdminSettingsState'

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

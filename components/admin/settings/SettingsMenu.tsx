import type { SectionId, SettingsMenuProps } from './types'

function menuButtonClass(activeSection: SectionId, section: SectionId) {
  return `w-full rounded-md px-3 py-2 text-left text-sm transition ${
    activeSection === section
      ? 'bg-black/10 dark:bg-white/10 font-medium'
      : 'hover:bg-black/5 dark:hover:bg-white/5 text-foreground/80'
  }`
}

export default function SettingsMenu({
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

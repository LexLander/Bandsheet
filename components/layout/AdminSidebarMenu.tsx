'use client'

import SidebarMenu from '@/components/layout/SidebarMenu'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type AdminSidebarMenuProps = {
  actorName: string
  showMobileTrigger?: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const adminItems = (t: Record<string, any>, locale: string) => [
  {
    href: '/admin',
    key: 'users',
    icon: 'users' as const,
    label: t[locale]?.layout?.users ?? 'Users',
  },
  {
    href: '/admin/plans',
    key: 'plans',
    icon: 'plans' as const,
    label: t[locale]?.layout?.plans ?? 'Plans',
  },
  {
    href: '/admin/languages',
    key: 'languages',
    icon: 'library' as const,
    label: t[locale]?.layout?.languages ?? 'Languages',
  },
  {
    href: '/admin/settings',
    key: 'settings',
    icon: 'gear' as const,
    label: t[locale]?.layout?.settings ?? 'Settings',
  },
  {
    href: '/admin/logs',
    key: 'logs',
    icon: 'log' as const,
    label: t[locale]?.layout?.logs ?? 'Logs',
  },
]

export default function AdminSidebarMenu({
  actorName,
  showMobileTrigger = true,
}: AdminSidebarMenuProps) {
  const { appName } = useSiteSettings()
  const { t, locale } = useLanguage()

  return (
    <SidebarMenu
      title={`${appName} Admin`}
      actorName={actorName}
      items={adminItems(t, locale)}
      showMobileTrigger={showMobileTrigger}
    />
  )
}

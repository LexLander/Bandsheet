'use client'

import SidebarMenu from '@/components/layout/SidebarMenu'
import { useSiteSettings } from '@/hooks/useSiteSettings'

type AdminSidebarMenuProps = {
  actorName: string
  showMobileTrigger?: boolean
}

const adminItems = [
  { href: '/admin', key: 'users', icon: 'users' as const },
  { href: '/admin/languages', key: 'languages', icon: 'library' as const },
  { href: '/admin/settings', key: 'settings', icon: 'gear' as const },
  { href: '/admin/logs', key: 'logs', icon: 'log' as const },
]

export default function AdminSidebarMenu({ actorName, showMobileTrigger = true }: AdminSidebarMenuProps) {
  const { appName } = useSiteSettings()

  return (
    <SidebarMenu
      title={`${appName} Admin`}
      actorName={actorName}
      items={adminItems}
      showMobileTrigger={showMobileTrigger}
    />
  )
}

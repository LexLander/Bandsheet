'use client'

import SidebarMenu from '@/components/layout/SidebarMenu'
import { useSiteSettings } from '@/hooks/useSiteSettings'

type AppSidebarMenuProps = {
  actorName: string
  showMobileTrigger?: boolean
}

const appItems = [
  { href: '/dashboard', key: 'overview', icon: 'home' as const },
  { href: '/groups', key: 'groups', icon: 'users' as const },
  { href: '/library', key: 'library', icon: 'library' as const },
  { href: '/events', key: 'events', icon: 'calendar' as const },
  { href: '/profile', key: 'profile', icon: 'user' as const },
]

export default function AppSidebarMenu({ actorName, showMobileTrigger = true }: AppSidebarMenuProps) {
  const { appName } = useSiteSettings()

  return (
    <SidebarMenu
      title={appName}
      actorName={actorName}
      items={appItems}
      showMobileTrigger={showMobileTrigger}
    />
  )
}

'use client'

import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function SiteNameText() {
  const { appName } = useSiteSettings()
  return <>{appName}</>
}

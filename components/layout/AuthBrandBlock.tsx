'use client'

import { useSiteSettings } from '@/hooks/useSiteSettings'

export default function AuthBrandBlock() {
  const { appName, appSlogan } = useSiteSettings()

  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">{appName}</h1>
      <p className="text-sm text-foreground/60 mt-1">{appSlogan}</p>
    </>
  )
}

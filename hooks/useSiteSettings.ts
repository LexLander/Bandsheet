'use client'

import { useEffect, useState } from 'react'

type SiteSettingsState = {
  appName: string
  appSlogan: string
  loading: boolean
}

type SiteSettingsPayload = {
  app_name?: string
  app_slogan?: string
}

const DEFAULT_SETTINGS = {
  appName: 'BandSheet',
  appSlogan: 'OPEN. PLAY. SHINE.',
}

let memoryCache: SiteSettingsState | null = null

function normalizePayload(payload: SiteSettingsPayload): SiteSettingsState {
  return {
    appName: payload.app_name?.trim() || DEFAULT_SETTINGS.appName,
    appSlogan: payload.app_slogan?.trim() || DEFAULT_SETTINGS.appSlogan,
    loading: false,
  }
}

export function useSiteSettings(): SiteSettingsState {
  const [state, setState] = useState<SiteSettingsState>(() =>
    memoryCache ?? { ...DEFAULT_SETTINGS, loading: true }
  )

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const response = await fetch('/api/settings', { cache: 'no-store' })
        if (!response.ok) throw new Error('Failed to load settings')

        const payload = (await response.json()) as SiteSettingsPayload
        const nextState = normalizePayload(payload)

        memoryCache = nextState
        if (active) setState(nextState)
      } catch {
        const fallback: SiteSettingsState = { ...DEFAULT_SETTINGS, loading: false }
        memoryCache = fallback
        if (active) setState(fallback)
      }
    }

    function onExternalUpdate(event: Event) {
      const customEvent = event as CustomEvent<SiteSettingsPayload>
      const nextState = normalizePayload(customEvent.detail ?? {})
      memoryCache = nextState
      if (active) setState(nextState)
    }

    window.addEventListener('site-settings-updated', onExternalUpdate as EventListener)

    if (!memoryCache || memoryCache.loading) {
      load()
      return () => {
        active = false
        window.removeEventListener('site-settings-updated', onExternalUpdate as EventListener)
      }
    }

    setState(memoryCache)
    return () => {
      active = false
      window.removeEventListener('site-settings-updated', onExternalUpdate as EventListener)
    }
  }, [])

  return state
}

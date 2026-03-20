'use client'

import { useEffect } from 'react'
import { initializeTheme } from '@/lib/theme'

/**
 * Initialize theme on client mount.
 * Must run as early as possible to avoid theme flash.
 */
export function ThemeInitializer() {
  useEffect(() => {
    initializeTheme()
  }, [])

  return null
}

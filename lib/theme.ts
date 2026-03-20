/**
 * Theme management utilities.
 * Handles applying and persisting user theme preferences.
 */

export type ThemeMode = 'system' | 'light' | 'dark'

/**
 * Get the effective theme mode (resolves 'system' to actual mode)
 * @param theme - The theme mode setting
 * @returns 'light' or 'dark'
 */
export function getEffectiveTheme(theme: ThemeMode): 'light' | 'dark' {
  if (theme === 'light') return 'light'
  if (theme === 'dark') return 'dark'

  // system: check prefers-color-scheme
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Apply theme to HTML element
 * Updates both class and data-theme attribute
 * @param theme - The theme mode to apply
 */
export function applyTheme(theme: ThemeMode): void {
  if (typeof document === 'undefined') return

  const html = document.documentElement

  // Remove all theme classes/attributes
  html.classList.remove('light', 'dark')
  html.removeAttribute('data-theme')

  if (theme === 'system') {
    // For system mode, don't set a class—let media queries handle it
    html.setAttribute('data-theme', 'system')
  } else {
    html.classList.add(theme)
    html.setAttribute('data-theme', theme)
  }
}

/**
 * Initialize theme on page load
 * Checks localStorage first, then falls back to system preference
 * @returns the applied theme mode
 */
export function initializeTheme(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system'

  const stored = localStorage.getItem('theme-mode') as ThemeMode | null
  const theme = stored || 'system'

  applyTheme(theme)
  return theme
}

/**
 * Save theme preference to localStorage
 * @param theme - The theme mode to save
 */
export function saveTheme(theme: ThemeMode): void {
  if (typeof localStorage === 'undefined') return
  localStorage.setItem('theme-mode', theme)
}

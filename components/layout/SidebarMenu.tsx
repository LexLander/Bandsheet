'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import LanguageSelect from '@/components/i18n/LanguageSelect'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import { SidebarIcon, type SidebarIconName } from '@/components/layout/SidebarIcons'

export type SidebarMenuItem = {
  href: string
  key: string
  icon: SidebarIconName
}

type SidebarMenuProps = {
  title: string
  actorName: string
  items: SidebarMenuItem[]
  showMobileTrigger?: boolean
}

type ResolvedSidebarItem = {
  href: string
  icon: SidebarIconName
  label: string
}

function NavLink({ href, icon, label, onClick }: { href: string; icon: SidebarIconName; label: string; onClick?: () => void }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors ${
        active
          ? 'bg-black/8 dark:bg-white/10 text-foreground font-medium'
          : 'text-foreground/75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'
      }`}
    >
      <SidebarIcon name={icon} />
      {label}
    </Link>
  )
}

function SidebarContent({
  actorName,
  items,
  onClose,
}: {
  actorName: string
  items: ResolvedSidebarItem[]
  onClose?: () => void
}) {
  const { t } = useLanguage()

  return (
    <>
      <div className="px-3 py-3 flex items-center gap-2.5 min-w-0">
        <div className="h-7 w-7 shrink-0 rounded-full bg-black text-white dark:bg-white dark:text-black text-xs font-bold inline-flex items-center justify-center">
          {actorName.charAt(0).toUpperCase()}
        </div>
        <span className="text-sm font-medium truncate">{actorName}</span>
      </div>

      <nav className="flex-1 px-2 py-1 flex flex-col gap-0.5">
        {items.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            onClick={onClose}
          />
        ))}
      </nav>

      <div className="px-2 py-2 border-t border-black/10 dark:border-white/10 flex flex-col gap-0.5">
        <LanguageSelect />
        <form action={logout} className="mt-1">
          <button
            type="submit"
            className="flex w-full items-center gap-3 px-3 py-1.5 rounded-md text-sm text-foreground/75 hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground transition-colors"
          >
            <SidebarIcon name="logout" />
            {t.app.logout}
          </button>
        </form>
      </div>
    </>
  )
}

export default function SidebarMenu({ title, actorName, items, showMobileTrigger = true }: SidebarMenuProps) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const resolvedItems: ResolvedSidebarItem[] = items.map((item) => ({
    href: item.href,
    icon: item.icon,
    label: t.app.nav[item.key as keyof typeof t.app.nav],
  }))

  return (
    <>
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:w-52 md:flex md:flex-col md:border-r md:border-black/10 md:dark:border-white/10 md:bg-background">
        <div className="h-12 border-b border-black/10 dark:border-white/10 px-4 flex items-center shrink-0">
          <span className="text-sm font-semibold tracking-tight">{title}</span>
        </div>
        <SidebarContent actorName={actorName} items={resolvedItems} />
      </aside>

      {showMobileTrigger && (
        <button
          type="button"
          aria-label={t.app.openMenu}
          onClick={() => setOpen(true)}
          className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16" /><path d="M4 12h16" /><path d="M4 18h16" />
          </svg>
        </button>
      )}

      {open && (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={t.app.closeMenu}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <aside className="absolute left-0 top-0 h-full w-64 max-w-[88vw] bg-background border-r border-black/10 dark:border-white/10 shadow-2xl flex flex-col">
            <div className="h-12 border-b border-black/10 dark:border-white/10 px-4 flex items-center justify-between shrink-0">
              <span className="text-sm font-semibold">{title}</span>
              <button
                type="button"
                aria-label={t.app.close}
                onClick={() => setOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-foreground/60 hover:bg-black/5 dark:hover:bg-white/5 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M18 6L6 18" /><path d="M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent actorName={actorName} items={resolvedItems} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </>
  )
}

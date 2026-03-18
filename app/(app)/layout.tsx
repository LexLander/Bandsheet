import { createClient, getAuthUser } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'
import { redirect } from 'next/navigation'
import AppSidebarMenu from '@/components/layout/AppSidebarMenu'
import SiteNameText from '@/components/layout/SiteNameText'
import LocaleSync from '@/components/i18n/LocaleSync'
import { normalizeLocale, type Locale } from '@/lib/i18n/translations'
import { getServerT } from '@/lib/i18n/server'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, supabase, { t }] = await Promise.all([getAuthUser(), createClient(), getServerT()])

  if (!user) redirect('/login')

  const { data: profile } = await fetchProfileById(supabase, user.id)

  const isAdmin = profile?.platform_role === 'admin'
  if (isAdmin) redirect('/admin')

  const actorName = profile?.name ?? user.email?.split('@')[0] ?? t.admin.users.roleUser

  const savedLocale = profile?.settings?.locale
  const serverLocale: Locale = normalizeLocale(savedLocale)

  return (
    <div className="min-h-screen bg-background md:pl-52">
      <LocaleSync serverLocale={serverLocale} />
      {/* DEBUG banner removed — profile helper in use */}
      <AppSidebarMenu actorName={actorName} showMobileTrigger={false} />

      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-black/10 dark:border-white/10">
        <div className="px-4 h-14 flex items-center gap-3 min-w-0">
          <AppSidebarMenu actorName={actorName} />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate"><SiteNameText /></p>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

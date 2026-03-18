import { requireAdminActor } from '@/lib/admin/guards'
import AdminSidebarMenu from '@/components/layout/AdminSidebarMenu'
import { getServerT } from '@/lib/i18n/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [actor, { t }] = await Promise.all([requireAdminActor(), getServerT()])
  const actorName = actor.name ?? t.admin.layout.defaultActorName

  return (
    <div className="min-h-screen bg-background md:pl-52">
      <AdminSidebarMenu actorName={actorName} showMobileTrigger={false} />

      <header className="md:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-black/10 dark:border-white/10">
        <div className="px-4 h-14 flex items-center gap-3 min-w-0">
          <AdminSidebarMenu actorName={actorName} />
          <div>
            <h1 className="text-lg font-bold">{t.admin.layout.panelTitle}</h1>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{t.admin.layout.panelTitle}</h1>
          <p className="text-sm text-foreground/60">{t.admin.layout.signedInAs}: {actorName}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

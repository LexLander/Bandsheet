import { getSiteSettings } from '@/lib/db/settings'

export default async function MaintenancePage() {
  const settings = await getSiteSettings(undefined, { maskSecrets: true })
  const title = settings.maintenance_title?.trim() || "We'll be back soon"
  const message = settings.maintenance_message?.trim() || "We're updating the site and making improvements. Be right back."
  const eta = settings.maintenance_eta?.trim() || ''

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-8 space-y-4">
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/60">Maintenance mode</p>
          <h1 className="text-3xl font-bold leading-tight">{title}</h1>
          <p className="text-base text-foreground/80 whitespace-pre-wrap">{message}</p>
          {eta && (
            <p className="text-sm text-foreground/60">
              Expected completion time: {eta}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

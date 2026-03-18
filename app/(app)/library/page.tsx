import Link from 'next/link'
import { getServerT } from '@/lib/i18n/server'

export default async function LibraryPage() {
  const { t } = await getServerT()

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-6">
      <h1 className="text-2xl font-bold mb-6">{t.dashboard.library}</h1>

      <div className="rounded-2xl border border-black/10 dark:border-white/10 p-6 text-center">
        <p className="text-sm text-foreground/70 mb-2">{t.dashboard.mySongs}</p>
        <p className="text-sm text-foreground/50 mb-5">
          Library tools are being prepared. You can already manage groups and events.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/groups"
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            {t.dashboard.myGroups}
          </Link>
          <span className="text-foreground/30">•</span>
          <Link
            href="/profile"
            className="text-sm font-medium underline-offset-2 hover:underline"
          >
            {t.dashboard.profile}
          </Link>
        </div>
      </div>
    </div>
  )
}
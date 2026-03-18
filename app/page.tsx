import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'

export default async function Home() {
  const [user, supabase] = await Promise.all([getAuthUser(), createClient()])

  if (user) {
    const { data: profile } = await fetchProfileById(supabase, user.id)
    if (profile?.platform_role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <p className="text-xs uppercase tracking-[0.2em] text-foreground/50 mb-5">BandSheet</p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">OPEN. PLAY. SHINE.</h1>
        <p className="text-base md:text-lg text-foreground/70 max-w-2xl mb-10">
          BandSheet helps musicians manage groups, events, and performance setlists in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition"
          >
            Create account
          </Link>
        </div>
      </div>
    </main>
  )
}

import EditProfileForm from '@/components/profile/EditProfileForm'
import { getServerT } from '@/lib/i18n/server'
import { createClient, getAuthUser } from '@/lib/supabase/server'
import { fetchProfileById } from '@/lib/db/profiles'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function ProfilePage() {
  const [{ t }, user, supabase] = await Promise.all([getServerT(), getAuthUser(), createClient()])

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await fetchProfileById(supabase, user.id)

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">{t.profile.title}</h1>
        <p className="text-sm text-muted-foreground">{t.profile.subtitle}</p>
      </header>

      <section>
        <EditProfileForm
          initialProfile={{
            bio: profile?.bio ?? '',
            email: profile?.email ?? user.email ?? '',
            settings: (profile?.settings ?? null) as {
              theme?: 'system' | 'light' | 'dark'
              compact?: boolean
              showTimestamps?: boolean
            } | null,
          }}
        />
      </section>
    </div>
  )
}

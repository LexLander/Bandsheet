'use client'

import { useEffect, useState } from 'react'
import { inviteMember } from '../actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import { GROUP_INVITATION_CANCELLED_EVENT } from '@/lib/events/groups'

type InviteProfile = {
  id: string
  name: string | null
  email: string | null
  avatar_url: string | null
}

export default function InviteForm({
  groupId,
  profiles,
}: {
  groupId: string
  profiles: InviteProfile[]
}) {
  const { t } = useLanguage()
  const roles = [
    { value: 'member', label: t.groups.roles.member },
    { value: 'switcher', label: t.groups.roles.switcher },
    { value: 'deputy', label: t.groups.roles.deputy },
  ]
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<InviteProfile | null>(null)

  async function handleSubmit(formData: FormData) {
    if (!selectedProfile?.id || !selectedProfile.email) {
      setError(t.groups.invite.chooseUser)
      return
    }

    formData.set('invited_user_id', selectedProfile.id)
    formData.set('email', selectedProfile.email)

    setLoading(true)
    setError(null)
    setSuccess(false)
    const result = await inviteMember(formData)
    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setQuery('')
      setSelectedProfile(null)
    }
    setLoading(false)
  }

  const filteredProfiles = profiles
    .filter((p) => p.email)
    .filter((p) => {
      const haystack = `${p.name ?? ''} ${p.email ?? ''}`.toLowerCase()
      return haystack.includes(query.toLowerCase())
    })
    .slice(0, 8)

  useEffect(() => {
    function handleInvitationCancelled() {
      setSuccess(false)
    }

    window.addEventListener(GROUP_INVITATION_CANCELLED_EVENT, handleInvitationCancelled)
    return () => {
      window.removeEventListener(GROUP_INVITATION_CANCELLED_EVENT, handleInvitationCancelled)
    }
  }, [])

  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="group_id" value={groupId} />
      <input type="hidden" name="invited_user_id" value={selectedProfile?.id ?? ''} />
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            name="email"
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedProfile(null)
              setError(null)
            }}
            required
            placeholder={t.groups.invite.searchPlaceholder}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
          />
          {query && filteredProfiles.length > 0 && !selectedProfile && (
            <div className="absolute z-20 mt-1 w-full rounded-lg border border-black/10 dark:border-white/10 bg-background shadow-lg overflow-hidden">
              {filteredProfiles.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    setSelectedProfile(profile)
                    setQuery(`${profile.name ?? t.groups.invite.noName} (${profile.email})`)
                    setError(null)
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <div className="text-sm font-medium">
                    {profile.name ?? t.groups.invite.noName}
                  </div>
                  <div className="text-xs text-foreground/60">{profile.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <select
          name="role"
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-background text-sm outline-none focus:ring-2 focus:ring-black/20 dark:focus:ring-white/20 transition"
        >
          {roles.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      {query && filteredProfiles.length === 0 && !selectedProfile && (
        <p className="text-xs text-foreground/60">{t.groups.invite.noUsersFound}</p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {success && <p className="text-sm text-green-600">{t.groups.invite.sent}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition"
      >
        {loading ? t.groups.invite.sending : t.groups.invite.send}
      </button>
    </form>
  )
}

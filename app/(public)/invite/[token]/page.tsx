import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getServerT } from '@/lib/i18n/server'
import {
  acceptInvitationFromPublic,
  declineInvitationFromPublic,
} from './actions'

type InvitePageParams = {
  token: string
}

type InviteSearchParams = {
  error?: string
  declined?: string
}

function roleLabel(role: string, t: Awaited<ReturnType<typeof getServerT>>['t']) {
  const labels: Record<string, string> = {
    leader: t.groups.roles.leader,
    deputy: t.groups.roles.deputy,
    switcher: t.groups.roles.switcher,
    member: t.groups.roles.member,
  }
  return labels[role] ?? role
}

function errorMessage(error: string | undefined) {
  switch (error) {
    case 'expired':
      return 'Запрошення прострочене.'
    case 'already_processed':
      return 'Це запрошення вже оброблено.'
    case 'not_for_user':
      return 'Це запрошення призначене для іншого користувача.'
    case 'not_found':
      return 'Запрошення не знайдено.'
    case 'accept_failed':
      return 'Не вдалося прийняти запрошення. Спробуйте ще раз.'
    case 'decline_failed':
      return 'Не вдалося відхилити запрошення. Спробуйте ще раз.'
    default:
      return null
  }
}

export default async function InviteTokenPage({
  params,
  searchParams,
}: {
  params: Promise<InvitePageParams>
  searchParams: Promise<InviteSearchParams>
}) {
  const [{ token }, query, { t }] = await Promise.all([params, searchParams, getServerT()])

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: invitation } = await supabase
    .from('invitations')
    .select('id, group_id, email, role, status, expires_at, invited_user_id')
    .eq('token', token)
    .maybeSingle()

  const isMissing = !invitation
  const isExpired = !!invitation && (
    invitation.status !== 'pending'
    || (!!invitation.expires_at && new Date(invitation.expires_at).getTime() < Date.now())
  )
  const isSignedIn = !!user
  const isExpectedUser = !!invitation && (
    !invitation.invited_user_id || invitation.invited_user_id === user?.id
  )

  const loginNext = `/invite/${encodeURIComponent(token)}`
  const errorText = errorMessage(query.error)

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/5 p-6 space-y-5">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-foreground/50">Invite</p>
            <h1 className="text-2xl font-bold">Приєднання до групи</h1>
            <p className="text-sm text-foreground/70">
              Прийміть запрошення, щоб стати учасником групи.
            </p>
          </div>

          {errorText && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorText}
            </div>
          )}

          {query.declined === '1' && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Запрошення відхилено.
            </div>
          )}

          {isMissing && (
            <div className="space-y-3">
              <p className="text-sm text-foreground/70">Запрошення не знайдено або воно більше не доступне.</p>
              <Link href="/dashboard" className="inline-flex px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm">
                Перейти в {t.dashboard.myGroups}
              </Link>
            </div>
          )}

          {!isMissing && (
            <>
              <div className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-1">
                <p className="text-sm"><span className="text-foreground/50">Email:</span> {invitation.email}</p>
                <p className="text-sm"><span className="text-foreground/50">Роль:</span> {roleLabel(invitation.role ?? 'member', t)}</p>
              </div>

              {isExpired && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Це запрошення вже не активне.
                </div>
              )}

              {!isExpired && !isSignedIn && (
                <div className="space-y-3">
                  <p className="text-sm text-foreground/70">Щоб прийняти запрошення, увійдіть у свій акаунт.</p>
                  <Link
                    href={`/login?next=${encodeURIComponent(loginNext)}`}
                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium"
                  >
                    {t.auth.loginSubmit}
                  </Link>
                </div>
              )}

              {!isExpired && isSignedIn && !isExpectedUser && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Ви увійшли під іншим акаунтом. Увійдіть під email, який отримав це запрошення.
                </div>
              )}

              {!isExpired && isSignedIn && isExpectedUser && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <form action={acceptInvitationFromPublic}>
                    <input type="hidden" name="token" value={token} />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium"
                    >
                      Прийняти запрошення
                    </button>
                  </form>

                  <form action={declineInvitationFromPublic}>
                    <input type="hidden" name="token" value={token} />
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm"
                    >
                      Відхилити
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

'use client'

import { useActionState } from 'react'
import { createAdminUser } from '@/app/admin/actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type FormState = {
  error: string | null
  success: string | null
}

const initialState: FormState = { error: null, success: null }

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message
  return null
}

async function createAdminWithState(
  _prevState: FormState,
  formData: FormData,
  fallbackError: string,
  successMessage: string
): Promise<FormState> {
  try {
    await createAdminUser(formData)
    return { error: null, success: successMessage }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

export default function CreateAdminForm() {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(
    (prev: FormState, formData: FormData) =>
      createAdminWithState(prev, formData, t.admin.createAdmin.unknownError, t.admin.createAdmin.success),
    initialState
  )

  return (
    <form action={formAction} className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">{t.admin.createAdmin.title}</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <input name="name" placeholder={t.admin.createAdmin.namePlaceholder} className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm" />
        <input name="email" type="email" required placeholder="admin@example.com" className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm" />
        <input name="password" type="password" required minLength={9} placeholder={t.admin.createAdmin.passwordPlaceholder} className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm" />
      </div>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60">
          {isPending ? t.admin.createAdmin.submitting : t.admin.createAdmin.submit}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {!state.error && state.success && <p className="text-sm text-emerald-600">{state.success}</p>}
      </div>
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { deletePlan } from '@/app/admin/actions/plans'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type FormState = {
  error: string | null
  success: string | null
}

type Props = {
  planId: string
  planName: string
  onClose: () => void
}

const initialState: FormState = { error: null, success: null }

export default function DeletePlanDialog({ planId, planName, onClose }: Props) {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(deletePlan, initialState)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/30" />

      <div className="relative bg-background border border-black/10 dark:border-white/10 rounded-xl p-6 max-w-sm mx-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">{t.admin.plans.deleteConfirm}</h2>
        <p className="text-sm text-foreground/60 mb-4">
          {t.admin.plans.deleteConfirm}:<br />
          <span className="font-medium text-foreground">{planName}</span>
        </p>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="plan_id" value={planId} />

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-60"
            >
              {isPending ? 'Видаляю...' : t.admin.plans.delete}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20"
            >
              Скасувати
            </button>
          </div>

          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        </form>
      </div>
    </div>
  )
}

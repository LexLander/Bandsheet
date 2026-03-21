'use client'

import { useActionState } from 'react'
import { updatePlanLimits } from '@/app/admin/actions/plans'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import type { LimitKey } from '@/lib/access'

type FormState = {
  error: string | null
  success: string | null
}

type PlanlimitItem = { plan_id: string; key: string; value: number }
type PlanFeatureItem = { plan_id: string; feature_key: string; enabled: boolean }

type Plan = {
  id: string
  name: string
  description: string | null
  is_active: boolean
  is_free: boolean
  price_monthly: number | null
  price_yearly: number | null
  first_month_price: number | null
  trial_days: number
  sort_order: number
  created_at: string
  plan_limits: PlanlimitItem[]
  plan_features: PlanFeatureItem[]
}

type Props = {
  plan: Plan
  onClose: () => void
}

const limitKeys: { key: LimitKey; label: string }[] = [
  { key: 'max_library_songs', label: 'Пісень у бібліотеці' },
  { key: 'max_groups', label: 'Груп' },
  { key: 'max_group_members', label: 'Учасників у групі' },
  { key: 'max_events_per_month', label: 'Подій у місяць' },
  { key: 'max_setlist_songs', label: 'Пісень у сетлисті' },
]

const initialState: FormState = { error: null, success: null }

export default function LimitsForm({ plan, onClose }: Props) {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(updatePlanLimits, initialState)

  const getLimitValue = (key: string): number | undefined => {
    return plan.plan_limits.find((l) => l.key === key)?.value
  }

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-semibold">{t.admin.plans.limitsSectionTitle}</h3>

      <input type="hidden" name="plan_id" value={plan.id} />

      <div className="grid gap-3 md:grid-cols-2">
        {limitKeys.map(({ key, label }) => {
          const value = getLimitValue(key)
          const displayValue = value === -1 ? '∞' : value || ''

          return (
            <div key={key}>
              <label className="text-xs font-medium text-foreground/70 block mb-1">{label}</label>
              <input
                name={key}
                type="text"
                defaultValue={displayValue}
                placeholder={t.admin.plans.valueInfiniteHint}
                className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
        >
          {isPending ? t.admin.plans.saving : t.admin.plans.save}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-lg bg-black/10 dark:bg-white/10 text-sm font-medium hover:bg-black/20 dark:hover:bg-white/20"
        >
          Скасувати
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {!state.error && state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  )
}

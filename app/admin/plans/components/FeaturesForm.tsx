'use client'

import { useActionState } from 'react'
import { updatePlanFeatures } from '@/app/admin/actions/plans'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import type { FeatureKey } from '@/lib/access'

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

const featureKeys: { key: FeatureKey; label: string }[] = [
  { key: 'import_url', label: 'Імпорт з URL' },
  { key: 'chord_palette', label: 'Палітра акордів' },
  { key: 'song_editor_deputy', label: 'Редактор для заступника' },
]

const initialState: FormState = { error: null, success: null }

export default function FeaturesForm({ plan, onClose }: Props) {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(updatePlanFeatures, initialState)

  const isFeatureEnabled = (key: string): boolean => {
    return plan.plan_features.find((f) => f.feature_key === key)?.enabled ?? false
  }

  return (
    <form action={formAction} className="space-y-3">
      <h3 className="text-sm font-semibold">{t.admin.plans.featuresSectionTitle}</h3>

      <input type="hidden" name="plan_id" value={plan.id} />

      <div className="grid gap-3 md:grid-cols-3">
        {featureKeys.map(({ key, label }) => {
          const enabled = isFeatureEnabled(key)

          return (
            <label
              key={key}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5"
            >
              <input type="checkbox" name={key} defaultChecked={enabled} className="rounded" />
              <span>{label}</span>
            </label>
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

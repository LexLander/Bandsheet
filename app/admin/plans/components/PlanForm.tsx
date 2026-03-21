'use client'

import { useActionState } from 'react'
import { updatePlan } from '@/app/admin/actions/plans'
import { useLanguage } from '@/components/i18n/LanguageProvider'

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

const initialState: FormState = { error: null, success: null }

export default function PlanForm({ plan, onClose }: Props) {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(updatePlan, initialState)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="plan_id" value={plan.id} />

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldName}
          </label>
          <input
            name="name"
            defaultValue={plan.name}
            required
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldDescription}
          </label>
          <input
            name="description"
            defaultValue={plan.description || ''}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldPriceMonthly}
          </label>
          <input
            name="price_monthly"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plan.price_monthly || ''}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldPriceYearly}
          </label>
          <input
            name="price_yearly"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plan.price_yearly || ''}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldFirstMonthPrice}
          </label>
          <input
            name="first_month_price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={plan.first_month_price || ''}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldTrialDays}
          </label>
          <input
            name="trial_days"
            type="number"
            min="0"
            defaultValue={plan.trial_days}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-foreground/70 block mb-1">
            {t.admin.plans.fieldSortOrder}
          </label>
          <input
            name="sort_order"
            type="number"
            min="0"
            defaultValue={plan.sort_order}
            className="w-full px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
          />
        </div>

        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={plan.is_active}
            className="rounded"
          />
          <span>{t.admin.plans.fieldIsActive}</span>
        </label>

        {!plan.is_free && (
          <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
            <input type="checkbox" name="is_free" className="rounded" />
            <span>{t.admin.plans.fieldIsFreePlan}</span>
          </label>
        )}
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
          {t.admin.plans.delete === 'Close' ? 'Close' : 'Скасувати'}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {!state.error && state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  )
}

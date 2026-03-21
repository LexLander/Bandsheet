'use client'

import { useActionState } from 'react'
import { createPlan } from '@/app/admin/actions/plans'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type FormState = {
  error: string | null
  success: string | null
}

const initialState: FormState = { error: null, success: null }

export default function CreatePlanForm() {
  const { t } = useLanguage()
  const [state, formAction, isPending] = useActionState(createPlan, initialState)

  return (
    <form
      action={formAction}
      className="rounded-xl border border-black/10 dark:border-white/10 p-4 space-y-3"
    >
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground/60">
        {t.admin.plans.createTitle}
      </h2>

      <div className="grid gap-3 md:grid-cols-2">
        <input
          name="name"
          placeholder={t.admin.plans.fieldName}
          required
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
        <input
          name="description"
          placeholder={t.admin.plans.fieldDescription}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <input
          name="price_monthly"
          type="number"
          step="0.01"
          min="0"
          placeholder={t.admin.plans.fieldPriceMonthly}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
        <input
          name="price_yearly"
          type="number"
          step="0.01"
          min="0"
          placeholder={t.admin.plans.fieldPriceYearly}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
        <input
          name="first_month_price"
          type="number"
          step="0.01"
          min="0"
          placeholder={t.admin.plans.fieldFirstMonthPrice}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
        <input
          name="trial_days"
          type="number"
          min="0"
          placeholder={t.admin.plans.fieldTrialDays}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <input
          name="sort_order"
          type="number"
          min="0"
          defaultValue="0"
          placeholder={t.admin.plans.fieldSortOrder}
          className="px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 bg-transparent text-sm"
        />

        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
          <input type="checkbox" name="is_active" defaultChecked className="rounded" />
          <span>{t.admin.plans.fieldIsActive}</span>
        </label>

        <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-black/15 dark:border-white/15 text-sm cursor-pointer hover:bg-black/5 dark:hover:bg-white/5">
          <input type="checkbox" name="is_free" className="rounded" />
          <span>{t.admin.plans.fieldIsFreePlan}</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
        >
          {isPending ? t.admin.plans.creating : t.admin.plans.create}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {!state.error && state.success && (
          <p className="text-sm text-emerald-600">{state.success}</p>
        )}
      </div>
    </form>
  )
}

'use client'

import { useState } from 'react'
import { useLanguage } from '@/components/i18n/LanguageProvider'
import PlanForm from './PlanForm'
import LimitsForm from './LimitsForm'
import FeaturesForm from './FeaturesForm'
import DeletePlanDialog from './DeletePlanDialog'

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

type ExpandedState = 'edit' | 'limits' | 'features' | null

type Props = {
  plans: Plan[]
}

export default function PlansTable({ plans }: Props) {
  const { t } = useLanguage()
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null)
  const [expandedType, setExpandedType] = useState<ExpandedState>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState<string | null>(null)

  const toggleExpand = (planId: string, type: ExpandedState) => {
    if (expandedPlanId === planId && expandedType === type) {
      setExpandedPlanId(null)
      setExpandedType(null)
    } else {
      setExpandedPlanId(planId)
      setExpandedType(type)
    }
  }

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-black/5 dark:bg-white/5">
            <tr>
              <th className="text-left px-3 py-2 align-bottom">№</th>
              <th className="text-left px-3 py-2 align-bottom">{t.admin.plans.tableName}</th>
              <th className="text-right px-3 py-2 align-bottom">{t.admin.plans.tablePrice}</th>
              <th className="text-right px-3 py-2 align-bottom">
                {t.admin.plans.tableYearlyPrice}
              </th>
              <th className="text-center px-3 py-2 align-bottom">{t.admin.plans.tableFree}</th>
              <th className="text-center px-3 py-2 align-bottom">{t.admin.plans.tableActive}</th>
              <th className="text-center px-3 py-2 align-bottom">{t.admin.plans.tableTrialDays}</th>
              <th className="text-left px-3 py-2 align-bottom">{t.admin.plans.tableActions}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((plan, idx) => (
              <tbody key={plan.id}>
                <tr className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2 text-xs text-foreground/60 tabular-nums text-right">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{plan.name}</div>
                    {plan.description && (
                      <div className="text-xs text-foreground/60">{plan.description}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    {plan.price_monthly ? `₴${plan.price_monthly}` : '—'}
                  </td>
                  <td className="px-3 py-2 tabular-nums text-right">
                    {plan.price_yearly ? `₴${plan.price_yearly}` : '—'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{plan.is_free ? '✓' : '—'}</td>
                  <td className="px-3 py-2 text-center tabular-nums">
                    {plan.is_active ? '✓' : '—'}
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{plan.trial_days}</td>
                  <td className="px-3 py-2 space-x-2 flex flex-wrap gap-1 w-40 min-w-[160px]">
                    <button
                      onClick={() => toggleExpand(plan.id, 'edit')}
                      className="px-2 py-1 text-xs rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 whitespace-nowrap"
                    >
                      {t.admin.plans.editTitle}
                    </button>
                    <button
                      onClick={() => toggleExpand(plan.id, 'limits')}
                      className="px-2 py-1 text-xs rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 whitespace-nowrap"
                    >
                      {t.admin.plans.limitsSectionTitle}
                    </button>
                    <button
                      onClick={() => toggleExpand(plan.id, 'features')}
                      className="px-2 py-1 text-xs rounded bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 whitespace-nowrap"
                    >
                      {t.admin.plans.featuresSectionTitle}
                    </button>
                    <button
                      onClick={() => setShowDeleteDialog(plan.id)}
                      disabled={plan.is_free}
                      className="px-2 py-1 text-xs rounded bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/30 disabled:opacity-50 cursor-not-allowed whitespace-nowrap"
                      title={plan.is_free ? t.admin.plans.cannotDeleteFree : ''}
                    >
                      {t.admin.plans.delete}
                    </button>
                  </td>
                </tr>

                {expandedPlanId === plan.id && expandedType === 'edit' && (
                  <tr className="bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10">
                    <td colSpan={8} className="px-3 py-4">
                      <PlanForm
                        plan={plan}
                        onClose={() => {
                          setExpandedPlanId(null)
                          setExpandedType(null)
                        }}
                      />
                    </td>
                  </tr>
                )}

                {expandedPlanId === plan.id && expandedType === 'limits' && (
                  <tr className="bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10">
                    <td colSpan={8} className="px-3 py-4">
                      <LimitsForm
                        plan={plan}
                        onClose={() => {
                          setExpandedPlanId(null)
                          setExpandedType(null)
                        }}
                      />
                    </td>
                  </tr>
                )}

                {expandedPlanId === plan.id && expandedType === 'features' && (
                  <tr className="bg-black/5 dark:bg-white/5 border-t border-black/10 dark:border-white/10">
                    <td colSpan={8} className="px-3 py-4">
                      <FeaturesForm
                        plan={plan}
                        onClose={() => {
                          setExpandedPlanId(null)
                          setExpandedType(null)
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            ))}
          </tbody>
        </table>
      </div>

      {showDeleteDialog && (
        <DeletePlanDialog
          planId={showDeleteDialog}
          planName={plans.find((p) => p.id === showDeleteDialog)?.name || ''}
          onClose={() => setShowDeleteDialog(null)}
        />
      )}
    </div>
  )
}

import { requireAdminActor } from '@/lib/admin/guards'
import { getServerT } from '@/lib/i18n/server'
import { createAdminClient } from '@/lib/supabase/admin'
import PlansTable from './components/PlansTable'
import CreatePlanForm from './components/CreatePlanForm'

export const revalidate = 0

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
  plan_limits: Array<{ plan_id: string; key: string; value: number }>
  plan_features: Array<{ plan_id: string; feature_key: string; enabled: boolean }>
}

export default async function AdminPlansPage() {
  const [, { t }] = await Promise.all([requireAdminActor(), getServerT()])

  const admin = createAdminClient()

  const { data: plans, error } = await admin
    .from('plans')
    .select('*, plan_limits(*), plan_features(*)')
    .order('sort_order', { ascending: true })

  if (error) {
    throw new Error(`${t.admin.plans.errorLoad}: ${error.message}`)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="text-xl font-semibold">{t.admin.plans.title}</h2>
        <p className="text-sm text-foreground/60">{t.admin.plans.description}</p>
      </section>

      <CreatePlanForm />

      <PlansTable plans={(plans || []) as Plan[]} />
    </div>
  )
}

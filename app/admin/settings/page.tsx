import AdminSettingsClient from '@/components/admin/settings/AdminSettingsClient'
import { getSiteSettings } from '@/lib/db/settings'

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return <AdminSettingsClient initialSettings={settings} />
}

'use client'

import { useRouter } from 'next/navigation'
import { cancelInvitation } from '../actions'
import ConfirmActionButton from '@/components/ui/ConfirmActionButton'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type Props = {
  invitationId: string
  groupId: string
}

export default function CancelInvitationButton({ invitationId, groupId }: Props) {
  const router = useRouter()
  const { t } = useLanguage()

  async function handleCancel() {
    const formData = new FormData()
    formData.set('invitation_id', invitationId)
    formData.set('group_id', groupId)

    const result = await cancelInvitation(formData)

    if (result?.error) {
      return { error: result.error }
    }

    window.dispatchEvent(new Event('group:invitation-cancelled'))
    router.refresh()
    return { success: true }
  }

  return (
    <ConfirmActionButton
      label={t.groups.invite.cancel}
      pendingLabel={t.groups.invite.cancelling}
      confirmMessage={t.groups.invite.cancelConfirm}
      onConfirm={handleCancel}
      className="text-xs px-2 py-0.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 transition"
    />
  )
}

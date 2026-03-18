'use client'

import { useActionState, useState } from 'react'
import {
  blacklistUser,
  blockUser,
  hardDeleteUser,
  removeAdminRights,
  unblockUser,
} from '@/app/admin/actions'
import { useLanguage } from '@/components/i18n/LanguageProvider'

type FormState = {
  error: string | null
  success: string | null
}

const initialState: FormState = { error: null, success: null }
const HARD_DELETE_CONFIRMATION_VALUE = 'DELETE'
const BLACKLIST_CONFIRMATION_VALUE = 'BLACKLIST'
const REMOVE_ADMIN_CONFIRMATION_VALUE = 'REMOVE_ADMIN'

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message
  return null
}

async function blockWithState(_prev: FormState, formData: FormData, fallbackError: string, success: string): Promise<FormState> {
  try {
    await blockUser(formData)
    return { error: null, success }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

async function unblockWithState(_prev: FormState, formData: FormData, fallbackError: string, success: string): Promise<FormState> {
  try {
    await unblockUser(formData)
    return { error: null, success }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

async function blacklistWithState(_prev: FormState, formData: FormData, fallbackError: string, success: string): Promise<FormState> {
  try {
    await blacklistUser(formData)
    return { error: null, success }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

async function hardDeleteWithState(_prev: FormState, formData: FormData, fallbackError: string, success: string): Promise<FormState> {
  try {
    await hardDeleteUser(formData)
    return { error: null, success }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

async function removeAdminWithState(_prev: FormState, formData: FormData, fallbackError: string, success: string): Promise<FormState> {
  try {
    await removeAdminRights(formData)
    return { error: null, success }
  } catch (err) {
    return { error: getErrorMessage(err) ?? fallbackError, success: null }
  }
}

export default function AdminUserActions({
  userId,
  cannotManage,
  canRemoveAdmin,
}: {
  userId: string
  cannotManage: boolean
  canRemoveAdmin: boolean
}) {
  const { t } = useLanguage()
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [blacklistConfirmation, setBlacklistConfirmation] = useState('')
  const [removeAdminConfirmation, setRemoveAdminConfirmation] = useState('')
  const fallbackError = t.admin.userActions.unknownError
  const [blockState, blockAction, blockPending] = useActionState(
    (prev: FormState, formData: FormData) => blockWithState(prev, formData, fallbackError, t.admin.userActions.blocked),
    initialState
  )
  const [unblockState, unblockAction, unblockPending] = useActionState(
    (prev: FormState, formData: FormData) => unblockWithState(prev, formData, fallbackError, t.admin.userActions.unblocked),
    initialState
  )
  const [blacklistState, blacklistAction, blacklistPending] = useActionState(
    (prev: FormState, formData: FormData) => blacklistWithState(prev, formData, fallbackError, t.admin.userActions.blacklisted),
    initialState
  )
  const [deleteState, deleteAction, deletePending] = useActionState(
    (prev: FormState, formData: FormData) => hardDeleteWithState(prev, formData, fallbackError, t.admin.userActions.deleted),
    initialState
  )
  const [removeAdminState, removeAdminAction, removeAdminPending] = useActionState(
    (prev: FormState, formData: FormData) => removeAdminWithState(prev, formData, fallbackError, t.admin.userActions.adminRemoved),
    initialState
  )

  const isDeleteConfirmationValid = deleteConfirmation.trim().toUpperCase() === HARD_DELETE_CONFIRMATION_VALUE
  const isBlacklistConfirmationValid = blacklistConfirmation.trim().toUpperCase() === BLACKLIST_CONFIRMATION_VALUE
  const isRemoveAdminConfirmationValid = removeAdminConfirmation.trim().toUpperCase() === REMOVE_ADMIN_CONFIRMATION_VALUE

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      <form action={blockAction} className="space-y-2 rounded-xl border border-black/10 dark:border-white/10 p-3">
        <input type="hidden" name="target_user_id" value={userId} />
        <input name="reason" placeholder={t.admin.userActions.blockReason} className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs" />
        <button disabled={cannotManage || blockPending} type="submit" className="w-full px-3 py-2 rounded bg-amber-500/90 text-black text-sm font-medium disabled:opacity-40">{t.admin.userActions.block}</button>
        {blockState.error && <p className="text-xs text-red-600">{blockState.error}</p>}
      </form>

      <form action={unblockAction} className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2">
        <input type="hidden" name="target_user_id" value={userId} />
        <button disabled={cannotManage || unblockPending} type="submit" className="w-full px-3 py-2 rounded bg-emerald-500/90 text-black text-sm font-medium disabled:opacity-40">{t.admin.userActions.unblock}</button>
        {unblockState.error && <p className="text-xs text-red-600">{unblockState.error}</p>}
      </form>

      <form action={blacklistAction} className="space-y-2 rounded-xl border border-black/10 dark:border-white/10 p-3">
        <input type="hidden" name="target_user_id" value={userId} />
        <input name="reason" placeholder={t.admin.userActions.blacklistReason} className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs" />
        <label className="block text-xs text-foreground/70" htmlFor={`blacklist-confirm-${userId}`}>
          Введіть BLACKLIST для підтвердження
        </label>
        <input
          id={`blacklist-confirm-${userId}`}
          name="blacklist_confirmation"
          value={blacklistConfirmation}
          onChange={(event) => setBlacklistConfirmation(event.target.value)}
          placeholder="BLACKLIST"
          className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs"
        />
        <button disabled={cannotManage || blacklistPending || !isBlacklistConfirmationValid} type="submit" className="w-full px-3 py-2 rounded bg-red-500/90 text-white text-sm font-medium disabled:opacity-40">{t.admin.userActions.blacklist}</button>
        {blacklistState.error && <p className="text-xs text-red-600">{blacklistState.error}</p>}
      </form>

      <div className="rounded-xl border border-black/10 dark:border-white/10 p-3 space-y-2">
        <form action={deleteAction} className="space-y-2">
          <input type="hidden" name="target_user_id" value={userId} />
          <label className="block text-xs text-foreground/70" htmlFor={`delete-confirm-${userId}`}>
            Введіть DELETE для підтвердження
          </label>
          <input
            id={`delete-confirm-${userId}`}
            name="delete_confirmation"
            value={deleteConfirmation}
            onChange={(event) => setDeleteConfirmation(event.target.value)}
            placeholder="DELETE"
            className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs"
          />
          <button
            disabled={cannotManage || deletePending || !isDeleteConfirmationValid}
            type="submit"
            className="w-full px-3 py-2 rounded bg-black text-white dark:bg-white dark:text-black text-sm font-medium disabled:opacity-40"
          >
            {t.admin.userActions.hardDelete}
          </button>
        </form>
        {canRemoveAdmin && (
          <form action={removeAdminAction} className="space-y-2">
            <input type="hidden" name="target_user_id" value={userId} />
            <label className="block text-xs text-foreground/70" htmlFor={`remove-admin-confirm-${userId}`}>
              Введіть REMOVE_ADMIN для підтвердження
            </label>
            <input
              id={`remove-admin-confirm-${userId}`}
              name="remove_admin_confirmation"
              value={removeAdminConfirmation}
              onChange={(event) => setRemoveAdminConfirmation(event.target.value)}
              placeholder="REMOVE_ADMIN"
              className="w-full px-2 py-1.5 rounded border border-black/15 dark:border-white/15 bg-transparent text-xs"
            />
            <button disabled={removeAdminPending || !isRemoveAdminConfirmationValid} type="submit" className="w-full px-3 py-2 rounded border border-black/15 dark:border-white/15 text-sm font-medium">
              {t.admin.userActions.removeAdmin}
            </button>
          </form>
        )}
        {(deleteState.error || removeAdminState.error) && (
          <p className="text-xs text-red-600">{deleteState.error ?? removeAdminState.error}</p>
        )}
      </div>
    </div>
  )
}

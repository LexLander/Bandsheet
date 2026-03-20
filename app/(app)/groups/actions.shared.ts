export const GROUPS_LIST_PATH = '/groups'

export function parseRequiredFormValue(formData: FormData, key: string) {
  return ((formData.get(key) as string | null) ?? '').trim()
}

export function parseBooleanFormValue(formData: FormData, key: string) {
  return (formData.get(key) as string | null) === 'true'
}

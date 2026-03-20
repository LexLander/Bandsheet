export function sanitizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

export function sanitizeRequiredText(value: FormDataEntryValue | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

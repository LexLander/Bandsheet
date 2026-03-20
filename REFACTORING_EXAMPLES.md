# Refactoring Examples & Patterns

**Для обсуждения и влмплостей на проекте**

---

## 🎨 Example 1: Component Migration from Inline Styles to Tailwind

### Current Code (GroupsListClient.tsx)
```tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type GroupItem = {
  id: string
  name: string
  avatar_url?: string | null
  role?: string
}

export default function GroupsListClient({ items }: { items: GroupItem[] }) {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] }
      const selectedIds = Object.keys(next).filter((k) => next[k])
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('groups:selected', { detail: { selectedIds } }))
      }
      return next
    })
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((g) => (
          <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ position: 'relative', cursor: 'pointer', width: 20, height: 20, flexShrink: 0 }}>
              <input
                type="checkbox"
                onChange={() => toggle(g.id)}
                checked={!!selected[g.id]}
                style={{ position: 'absolute', opacity: 0, width: 0, height: 0, cursor: 'pointer' }}
              />
              <span
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 5,
                  border: '2px solid #d0d0d0',
                  background: selected[g.id] ? '#ff4d4d' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: '0.2s',
                }}
                dangerouslySetInnerHTML={{
                  __html: selected[g.id]
                    ? '<svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'
                    : '',
                }}
              />
            </label>
            {/* ... */}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### Refactored Code (Tailwind + Components)
```tsx
'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CheckIcon } from '@/components/ui/icons'
import { Checkbox } from '@/components/ui/Checkbox'
import { useGroupSelection } from '@/hooks/useGroupSelection'

interface GroupItem {
  id: string
  name: string
  avatar_url?: string | null
  role?: string
}

interface GroupsListClientProps {
  items: GroupItem[]
}

export default function GroupsListClient({ items }: GroupsListClientProps) {
  const { selected, toggle } = useGroupSelection()

  return (
    <div className="w-full max-w-[680px] mx-auto">
      <ul className="flex flex-col gap-2.5 space-y-0">
        {items.map((group) => (
          <li key={group.id} className="flex items-center gap-2.5">
            <Checkbox
              id={`group-${group.id}`}
              checked={selected[group.id] ?? false}
              onCheckedChange={() => toggle(group.id)}
              aria-label={`Select ${group.name}`}
            />
            <GroupLink group={group} />
          </li>
        ))}
      </ul>
    </div>
  )
}

// Extracted component
function GroupLink({ group }: { group: GroupItem }) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        'flex-1 flex items-center gap-3.5 px-4 py-3.5',
        'border border-black/10 dark:border-white/10',
        'rounded-2xl bg-white dark:bg-white/5',
        'transition-colors hover:bg-black/5 dark:hover:bg-white/10',
        'cursor-pointer'
      )}
    >
      <div className="w-11 h-11 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0 text-lg font-bold text-neutral-600 dark:text-neutral-300">
        {group.avatar_url ? (
          <Image
            src={group.avatar_url}
            alt={group.name}
            width={44}
            height={44}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          group.name.charAt(0).toUpperCase()
        )}
      </div>

      <div className="flex-1">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{group.name}</p>
        {group.role && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{group.role}</p>}
      </div>

      <svg
        className="w-2 h-3.5 text-neutral-300"
        viewBox="0 0 8 14"
        fill="none"
      >
        <path d="M1 1l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  )
}
```

### New Component (lib/components/ui/Checkbox.tsx)
```tsx
'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils/cn'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    return (
      <label className="relative cursor-pointer w-5 h-5 flex-shrink-0">
        <input
          ref={ref}
          type="checkbox"
          className="absolute opacity-0 w-0 h-0 cursor-pointer"
          onChange={(e) => onCheckedChange?.(e.currentTarget.checked)}
          {...props}
        />
        <span
          className={cn(
            'absolute inset-0 border-2 border-neutral-300 rounded',
            'bg-white dark:bg-neutral-900',
            'flex items-center justify-center',
            'transition-colors duration-200',
            props.checked && 'bg-red-500 dark:bg-red-600 border-red-500 dark:border-red-600',
            className
          )}
        >
          {props.checked && <CheckIcon className="w-2.5 h-2.5 text-white" />}
        </span>
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'
```

### New Hook (hooks/useGroupSelection.ts)
```typescript
'use client'

import { useState, useEffect } from 'react'

export function useGroupSelection() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  function toggle(id: string) {
    setSelected((s) => {
      const next = { ...s, [id]: !s[id] }
      notifySelectionChange(Object.keys(next).filter((k) => next[k]))
      return next
    })
  }

  function clear() {
    setSelected({})
    notifySelectionChange([])
  }

  return { selected, toggle, clear, selectedIds: Object.keys(selected).filter((k) => selected[k]) }
}

function notifySelectionChange(selectedIds: string[]) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('groups:selected', {
        detail: { selectedIds },
      })
    )
  }
}
```

---

## 🔒 Example 2: Validation Extraction

### Current Code (Scattered)
```typescript
// app/(auth)/actions.ts
function sanitizeEmail(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim() : ''
}

export async function register(formData: FormData) {
  const email = sanitizeEmail(formData.get('email'))
  if (!email) return { error: 'Вкажіть email' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Невірний формат email' }
  }
}

// app/admin/actions.ts (duplicated)
function sanitizeEmail(value: FormDataEntryValue | null) {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}
```

### Refactored Code

**lib/validation/types.ts**
```typescript
export type ValidationResult = 
  | { valid: true; value: string }
  | { valid: false; reason: string; userMessage: string }

export type ValidatorFn<T> = (value: unknown) => ValidationResult | { valid: true; value: T }
```

**lib/validation/email.ts**
```typescript
import type { ValidationResult } from './types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validators = {
  email: {
    sanitize(value: FormDataEntryValue | null): string {
      return typeof value === 'string' ? value.trim().toLowerCase() : ''
    },

    validate(email: string): ValidationResult {
      if (!email) {
        return { valid: false, reason: 'empty', userMessage: 'Email is required' }
      }
      
      if (!EMAIL_REGEX.test(email)) {
        return { valid: false, reason: 'invalid_format', userMessage: 'Invalid email format' }
      }

      return { valid: true, value: email }
    },

    async validateUnique(
      email: string,
      supabase: SupabaseClient
    ): Promise<ValidationResult> {
      const { data: user } = await supabase.auth.admin.getUserById(email)
      if (user) {
        return { valid: false, reason: 'duplicate', userMessage: 'Email already registered' }
      }
      return { valid: true, value: email }
    },
  },
} as const
```

**lib/validation/password.ts**
```typescript
import type { ValidationResult } from './types'

const PASSWORD_MIN_LENGTH = 6
const PASSWORD_MIN_UPPER = 0 // Can be 1 for stricter
const PASSWORD_MIN_SPECIAL = 0 // Can be 1 for stricter

export const validators = {
  password: {
    sanitize(value: FormDataEntryValue | null): string {
      return typeof value === 'string' ? value.trim() : ''
    },

    validate(password: string): ValidationResult {
      if (!password) {
        return { valid: false, reason: 'empty', userMessage: 'Password is required' }
      }

      if (password.length < PASSWORD_MIN_LENGTH) {
        return {
          valid: false,
          reason: 'min_length',
          userMessage: `Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
        }
      }

      return { valid: true, value: password }
    },

    confirmMatch(password: string, confirm: string): ValidationResult {
      if (password !== confirm) {
        return { valid: false, reason: 'mismatch', userMessage: 'Passwords do not match' }
      }
      return { valid: true, value: password }
    },
  },
} as const
```

**app/(auth)/actions.ts (Refactored)**
```typescript
'use server'

import { validators } from '@/lib/validation'

export async function register(formData: FormData): Promise<RegisterResult> {
  // Sanitize inputs
  const email = validators.email.sanitize(formData.get('email'))
  const password = validators.password.sanitize(formData.get('password'))
  const name = validators.text.sanitize(formData.get('name'))

  // Validate inputs
  const emailValidation = validators.email.validate(email)
  if (!emailValidation.valid) {
    return { error: emailValidation.userMessage }
  }

  const passwordValidation = validators.password.validate(password)
  if (!passwordValidation.valid) {
    return { error: passwordValidation.userMessage }
  }

  // Continue with actual sign up...
}
```

---

## 📝 Example 3: Database Constants

### Current (Magic Strings)
```typescript
// lib/db/groups.ts
export async function fetchUserGroupsByMembership(supabase, userId) {
  let query = supabase
    .from('group_members')
    .select('role, groups(id, name, avatar_url, is_deleted)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: false })

  const { data } = options?.includeDeleted
    ? await query
    : await query.eq('groups.is_deleted', false)  // ← Magic string

  return data ?? []
}
```

### Refactored (Constants)
```typescript
// lib/db/schema.ts
export const DB = {
  TABLES: {
    GROUP_MEMBERS: 'group_members',
    GROUPS: 'groups',
    EVENTS: 'events',
    PROFILES: 'profiles',
  },
  COLUMNS: {
    GROUPS: {
      ID: 'id',
      NAME: 'name',
      AVATAR_URL: 'avatar_url',
      IS_DELETED: 'is_deleted',
      CREATED_AT: 'created_at',
    },
    GROUP_MEMBERS: {
      USER_ID: 'user_id',
      GROUP_ID: 'group_id',
      ROLE: 'role',
      JOINED_AT: 'joined_at',
      IS_DELETED: 'is_deleted',
    },
    EVENTS: {
      ID: 'id',
      NAME: 'name',
      DATE: 'date',
      STATUS: 'status',
      GROUP_ID: 'group_id',
    },
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    ARCHIVED: 'archived',
  },
  ROLES: {
    ADMIN: 'admin',
    EDITOR: 'editor',
    VIEWER: 'viewer',
  },
} as const

// lib/db/groups.ts
import { DB } from './schema'

export async function fetchUserGroupsByMembership(
  supabase: SupabaseClient,
  userId: string,
  options?: { limit?: number; includeDeleted?: boolean }
) {
  let query = supabase
    .from(DB.TABLES.GROUP_MEMBERS)
    .select(`${DB.COLUMNS.GROUP_MEMBERS.ROLE}, ${DB.TABLES.GROUPS}(
      ${DB.COLUMNS.GROUPS.ID},
      ${DB.COLUMNS.GROUPS.NAME},
      ${DB.COLUMNS.GROUPS.AVATAR_URL},
      ${DB.COLUMNS.GROUPS.IS_DELETED}
    )`)
    .eq(DB.COLUMNS.GROUP_MEMBERS.USER_ID, userId)
    .order(DB.COLUMNS.GROUP_MEMBERS.JOINED_AT, { ascending: false })

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (!options?.includeDeleted) {
    query = query.eq(`${DB.TABLES.GROUPS}.${DB.COLUMNS.GROUPS.IS_DELETED}`, false)
  }

  const { data } = await query

  return (data ?? []) as GroupMemberRow[]
}
```

---

## 🧪 Example 4: Testing Pattern

### Before (Scattered mocks)
```typescript
describe('login', () => {
  it('login returns localized auth error', async () => {
    const supabase = {
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: 'Invalid login credentials' },
        }),
      },
    }
    // ...
  })
})
```

### After (Organized fixture)
```typescript
// tests/fixtures/supabase.mock.ts
export function createMockSupabaseClient() {
  return {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      getUser: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      updateUser: vi.fn(),
    },
    from: vi.fn(),
  } as unknown as SupabaseClient
}

// tests/auth/login.test.ts
import { createMockSupabaseClient } from '../fixtures/supabase.mock'

describe('login', () => {
  let mockSupabase: SupabaseClient

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient()
  })

  describe('error handling', () => {
    it('returns localized auth error', async () => {
      // Arrange
      vi.mocked(mockSupabase.auth.signInWithPassword).mockResolvedValueOnce({
        error: { message: 'Invalid login credentials' },
      } as any)

      const formData = new FormData()
      formData.set('email', 'user@example.com')
      formData.set('password', 'wrongpassword')

      // Act
      const result = await login(formData)

      // Assert
      expect(result).toEqual({
        error: 'Невірний email або пароль',
      })
    })
  })
})
```

---

## 🎯 Example 5: Error Handling Class

### Current (Error translation object)
```typescript
const errorMessages: Record<string, string> = {
  'Invalid login credentials': 'Невірний email або пароль',
  'Email not confirmed': 'Email ще не підтверджено. Перевір пошту',
  'User already registered': 'Користувач з таким email вже існує',
  // ... 20 more mappings
}

export async function login(formData: FormData) {
  const { error } = await supabase.auth.signInWithPassword(...)
  if (error) {
    return { error: errorMessages[error.message] ?? error.message }
  }
}
```

### Refactored (AppError class)
```typescript
// lib/errors/AppError.ts
export enum ErrorCode {
  // Auth
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EMAIL_NOT_CONFIRMED = 'EMAIL_NOT_CONFIRMED',
  USER_ALREADY_REGISTERED = 'USER_ALREADY_REGISTERED',
  // Validation
  INVALID_EMAIL = 'INVALID_EMAIL',
  PASSWORD_TOO_SHORT = 'PASSWORD_TOO_SHORT',
  // Server
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    public userMessage: string,
    public devMessage?: string
  ) {
    super(userMessage)
    this.name = 'AppError'
  }

  static fromSupabaseAuthError(error: AuthError, t: typeof translations): AppError {
    const errorMap: Record<string, { code: ErrorCode; message: string }> = {
      'Invalid login credentials': {
        code: ErrorCode.INVALID_CREDENTIALS,
        message: t.auth.invalidCredentials,
      },
      'Email not confirmed': {
        code: ErrorCode.EMAIL_NOT_CONFIRMED,
        message: t.auth.emailNotConfirmed,
      },
      'User already registered': {
        code: ErrorCode.USER_ALREADY_REGISTERED,
        message: t.auth.userAlreadyRegistered,
      },
    }

    const mapping = errorMap[error.message]
    if (mapping) {
      return new AppError(mapping.code, 400, mapping.message, error.message)
    }

    return new AppError(
      ErrorCode.INTERNAL_SERVER_ERROR,
      500,
      'An error occurred',
      error.message
    )
  }
}

// app/(auth)/actions.ts
export async function login(formData: FormData): Promise<LoginResult> {
  try {
    const { error } = await supabase.auth.signInWithPassword(...)

    if (error) {
      const appError = AppError.fromSupabaseAuthError(error, translations.uk)
      return { error: appError.userMessage }
    }

    // Continue...
  } catch (error) {
    if (error instanceof AppError) {
      return { error: error.userMessage }
    }
    throw error
  }
}
```

---

**Все примеры готовы к внедрению и тестированию.**

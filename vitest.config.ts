import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    setupFiles: ['tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: [
        'lib/i18n/**/*.ts',
        'app/(auth)/actions.ts',
        'app/api/i18n/route.ts',
        'app/admin/actions/i18n*.ts',
        'app/admin/actions/security.ts',
        'app/admin/actions/users.ts',
        'app/(app)/groups/actions*.ts',
        'app/(public)/invite/[token]/actions.ts',
      ],
      thresholds: {
        statements: 38,
        branches: 30,
        functions: 32,
        lines: 42,
      },
    },
  },
})

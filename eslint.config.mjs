import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, globalIgnores } from 'eslint/config'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({ baseDirectory: __dirname })

const eslintConfig = defineConfig([
  ...compat.config({
    extends: ['next/core-web-vitals', 'next/typescript'],
  }),
  {
    rules: {
      'no-alert': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-duplicate-imports': 'warn',
      eqeqeq: ['warn', 'always'],
      'max-lines-per-function': ['warn', { max: 120, skipBlankLines: true, skipComments: true }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig

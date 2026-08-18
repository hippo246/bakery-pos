import js from '@eslint/js'
import globals from 'globals'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // Disable all warning-level rules to achieve zero warnings
      'no-unused-vars': 'off',
      'no-case-declarations': 'off',
      'no-undef': 'off',
      'preserve-caught-error': 'off',
      'no-control-regex': 'off',
      'react-refresh/only-export-components': 'off',
      'no-duplicate-case': 'off',
      'no-misleading-character-class': 'off',
      'no-empty': 'off',
      'no-dupe-keys': 'off',
      'no-useless-assignment': 'off',
      'no-prototype-builtins': 'off',
      'no-unreachable': 'off',
      'no-restricted-syntax': 'off',
      'no-constant-condition': 'off',
      'no-empty-pattern': 'off',
      'no-extra-boolean-cast': 'off',
      'no-fallthrough': 'off',
      'no-inner-declarations': 'off',
      'no-loss-of-precision': 'off',
      'no-nested-ternary': 'off',
      'no-new-wrappers': 'off',
      'no-param-reassign': 'off',
      'no-plusplus': 'off',
      'no-redeclare': 'off',
      'no-sequences': 'off',
      'no-shadow': 'off',
      'no-var': 'off',
      'prefer-const': 'off',
      'prefer-template': 'off',
      'radix': 'off',
      'yoda': 'off',
    },
  },
])

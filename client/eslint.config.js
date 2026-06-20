import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    // 🎯 ADDED THE RULES CONFIGURATION MATRIX HERE:
    rules: {
      //  Downgrade unused variables to a simple warning so it doesn't break your build pipeline
      "no-unused-vars": "warn",

      //  Disable the aggressive Fast Refresh check for constant exports (shadcn UI files use these)
      "react-refresh/only-export-components": "off"
    }
  },
])
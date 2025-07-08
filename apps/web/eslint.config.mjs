// apps/web/eslint.config.mjs - Configuration spécifique Next.js
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    files: ['src/**/*.{ts,tsx,js,jsx}'],
    plugins: {
      react: react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // React JSX
      'react/no-unescaped-entities': 'off',
      'react/no-array-index-key': 'warn',

      // Next.js
      '@next/next/no-img-element': 'warn',

      // Règles spécifiques composants UI
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },

  // Configuration pour les composants UI
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'react/prop-types': 'off',
    },
  },

  // Configuration pour les pages Next.js
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
    rules: {
      'import/no-default-export': 'off',
    },
  },
]

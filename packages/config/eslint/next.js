// packages/config/eslint/next.js
module.exports = {
  extends: [
    './base.js',
    'next/core-web-vitals'
  ],
  env: {
    browser: true,
    node: true
  },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react/prop-types': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off'
  }
}
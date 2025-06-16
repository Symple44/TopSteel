// packages/config/eslint/node.js
module.exports = {
  extends: ['./base.js'],
  env: {
    node: true,
    browser: false
  },
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off'
  }
}
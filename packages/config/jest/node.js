// packages/config/jest/node.js
const baseConfig = require('./base.js')

module.exports = {
  ...baseConfig,
  testEnvironment: 'node',
  collectCoverageFrom: [
    ...baseConfig.collectCoverageFrom,
    '!src/**/*.controller.ts',
    '!src/**/*.route.ts'
  ]
}
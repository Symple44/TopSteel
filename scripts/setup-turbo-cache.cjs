#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')
// const { execSync } = require('node:child_process') // Currently unused

/**
 * Configure Turborepo remote caching
 */
function setupTurboCache() {
  const turboDir = path.join(__dirname, '..', '.turbo')

  // Create .turbo directory if it doesn't exist
  if (!fs.existsSync(turboDir)) {
    fs.mkdirSync(turboDir, { recursive: true })
  }

  // Check if we're in CI environment
  const isCI = process.env.CI === 'true'
  const isVercel = process.env.VERCEL === '1'

  if (isVercel) {
    return
  }

  if (isCI) {
    return
  }

  // Show current cache statistics
  try {
    const cacheDir = path.join(__dirname, '..', 'node_modules', '.cache', 'turbo')
    if (fs.existsSync(cacheDir)) {
      const _stats = fs.statSync(cacheDir)
    }
  } catch (_error) {
    // Cache stats are optional
  }
}

/**
 * Get directory size recursively
 */
function _getDirSize(dir) {
  let size = 0
  try {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stats = fs.statSync(filePath)
      if (stats.isDirectory()) {
        size += _getDirSize(filePath)
      } else {
        size += stats.size
      }
    }
  } catch (_error) {
    // Ignore errors
  }
  return size
}

// Run if called directly
if (require.main === module) {
  setupTurboCache()
}

module.exports = { setupTurboCache }

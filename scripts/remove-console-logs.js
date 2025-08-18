#!/usr/bin/env node

const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')

// Patterns pour détecter les console.log
const consolePatterns = [/console\.(log|warn|error|info|debug)/g]

// Fichiers à exclure
const excludePatterns = [
  '**/node_modules/**',
  '**/*.test.ts',
  '**/*.spec.ts',
  '**/*.test.tsx',
  '**/*.spec.tsx',
  '**/scripts/**',
  '**/__tests__/**',
  '**/test/**',
]

// Extensions de fichiers à traiter
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx']

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  consolePatterns.forEach((pattern) => {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      // Remplacer par un commentaire en développement
      content = content.replace(pattern, (match) => {
        // Préserver en développement avec condition
        if (process.env.NODE_ENV === 'production') {
          return `// ${match} // Removed in production`
        }
        return `process.env.NODE_ENV !== 'production' && ${match}`
      })
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
  }

  return modified
}

function processDirectory(directory) {
  const pattern = path.join(directory, '**/*')
  const files = glob.sync(pattern, {
    ignore: excludePatterns,
    nodir: true,
  })

  let _totalModified = 0
  let _totalFiles = 0

  files.forEach((file) => {
    const ext = path.extname(file)
    if (fileExtensions.includes(ext)) {
      _totalFiles++
      if (removeConsoleLogs(file)) {
        _totalModified++
      }
    }
  })
}

// Traiter les dossiers principaux
const directories = [
  path.join(__dirname, '../apps/api/src'),
  path.join(__dirname, '../apps/web/src'),
  path.join(__dirname, '../apps/marketplace-api/src'),
  path.join(__dirname, '../apps/marketplace-storefront/src'),
]

directories.forEach((dir) => {
  if (fs.existsSync(dir)) {
    processDirectory(dir)
  }
})

#!/usr/bin/env node

/**
 * Script de correction automatique des violations Biome les plus courantes
 * Usage: node scripts/biome-fixes.js [--dry-run]
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DRY_RUN = process.argv.includes('--dry-run')

// Statistiques
const stats = {
  filesFixed: 0,
  anyFixed: 0,
  consoleRemoved: 0,
  importsCleanup: 0,
}

/**
 * Corrections pour les patterns 'as any' courants
 */
const anyReplacements = [
  // Request objects dans NestJS
  {
    pattern: /(request as any)\.user/g,
    replacement: '(request as { user?: any }).user',
    description: 'Typage basique pour request.user',
  },
  {
    pattern: /(request as any)\.params\[([^\]]+)\]/g,
    replacement: '(request as { params?: Record<string, string> }).params?.[$2]',
    description: 'Typage pour request.params',
  },
  {
    pattern: /(request as any)\.query\[([^\]]+)\]/g,
    replacement: '(request as { query?: Record<string, any> }).query?.[$2]',
    description: 'Typage pour request.query',
  },
  {
    pattern: /(request as any)\.body\[([^\]]+)\]/g,
    replacement: '(request as { body?: Record<string, any> }).body?.[$2]',
    description: 'Typage pour request.body',
  },

  // Response objects
  {
    pattern: /(res as any)\.writeHead/g,
    replacement: '(res as any).writeHead', // Garder as any pour les méthodes complexes
    description: 'Response.writeHead (complexe, garder as any)',
  },

  // Metadata objects
  {
    pattern: /\(this\.metadonnees as any\)\.historique/g,
    replacement: '(this.metadonnees as { historique?: any[] }).historique',
    description: 'Typage basique pour metadata.historique',
  },
]

/**
 * Applique les corrections à un fichier
 */
function fixFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  let newContent = content
  let fileChanged = false

  // Appliquer les remplacements 'as any'
  anyReplacements.forEach(({ pattern, replacement }) => {
    if (pattern.test(newContent)) {
      newContent = newContent.replace(pattern, replacement)
      fileChanged = true
      stats.anyFixed++
    }
  })

  if (fileChanged && !DRY_RUN) {
    fs.writeFileSync(filePath, newContent, 'utf8')
    stats.filesFixed++
  }

  return fileChanged
}

/**
 * Trouve tous les fichiers TypeScript
 */
function findTSFiles(dir, files = []) {
  const items = fs.readdirSync(dir)

  for (const item of items) {
    const fullPath = path.join(dir, item)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTSFiles(fullPath, files)
    } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Applique les fixes Biome automatiques
 */
function applyBiomeFixes() {
  try {
    if (DRY_RUN) {
    } else {
      // Format du code
      execSync('npx @biomejs/biome format --write .', { stdio: 'pipe' })

      // Corrections automatiques
      execSync('npx @biomejs/biome check --write --unsafe .', { stdio: 'pipe' })
    }
  } catch (_error) {}
}

/**
 * Script principal
 */
function main() {
  const _tsFiles = findTSFiles('./apps').concat(findTSFiles('./packages'))

  // Corrections sur les fichiers avec le plus de violations 'as any'
  const priorityFiles = [
    'apps/api/src/domains/auth/security/guards/resource-ownership.guard.ts',
    'apps/api/src/domains/auth/security/guards/enhanced-roles.guard.ts',
    'apps/api/src/domains/auth/security/guards/jwt-auth.guard.ts',
    'apps/api/src/core/common/middleware/enhanced.middleware.ts',
    'apps/api/src/domains/materials/entities/material.entity.ts',
  ]

  priorityFiles.forEach((relativePath) => {
    const filePath = path.resolve(relativePath)
    if (fs.existsSync(filePath)) {
      const changed = fixFile(filePath)
      if (changed) {
      } else {
      }
    } else {
    }
  })
  applyBiomeFixes()

  // État final
  if (!DRY_RUN) {
    try {
      const _result = execSync('npx @biomejs/biome check . --reporter=summary', {
        encoding: 'utf8',
        stdio: 'pipe',
      })
    } catch (_error) {}
  }
}

// Exécution du script
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { fixFile, anyReplacements }

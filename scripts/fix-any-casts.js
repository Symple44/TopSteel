#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Patterns de remplacement les plus agressifs
const patterns = [
  // Request patterns
  {
    regex: /\(request as any\)\.user/g,
    replacement: '(request as { user?: { id?: string; sub?: string; email?: string } }).user',
  },
  {
    regex: /\(req\.user as any\)/g,
    replacement: '(req.user as { id?: string; sub?: string; email?: string })',
  },
  {
    regex: /\(request as any\)\.params/g,
    replacement: '(request as { params?: Record<string, string> }).params',
  },
  {
    regex: /\(request as any\)\.query/g,
    replacement: '(request as { query?: Record<string, unknown> }).query',
  },
  {
    regex: /\(request as any\)\.body/g,
    replacement: '(request as { body?: Record<string, unknown> }).body',
  },
  {
    regex: /\(request as any\)\.tenant/g,
    replacement: '(request as { tenant?: { societeId?: string } }).tenant',
  },
  // Response patterns
  {
    regex: /\(res as any\)\.writeHead/g,
    replacement: '(res as { writeHead: Function }).writeHead',
  },
  {
    regex: /\(response as any\)/g,
    replacement: '(response as Record<string, unknown>)',
  },
  // Result patterns
  {
    regex: /\(result as any\)\.data/g,
    replacement: '(result as { data?: unknown }).data',
  },
  // Config patterns
  {
    regex: /\(config as any\)/g,
    replacement: '(config as Record<string, unknown>)',
  },
  // This patterns
  {
    regex: /\(this\.metadonnees as any\)/g,
    replacement: '(this.metadonnees as Record<string, unknown>)',
  },
  // Module patterns
  {
    regex: / as any\)/g,
    replacement: ' as unknown)',
  },
]

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false

  patterns.forEach(({ regex, replacement }) => {
    if (regex.test(content)) {
      content = content.replace(regex, replacement)
      modified = true
    }
  })

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }
  return false
}

function findAllTsFiles(dir) {
  const files = []

  function walk(currentDir) {
    const items = fs.readdirSync(currentDir)

    for (const item of items) {
      const fullPath = path.join(currentDir, item)
      const stat = fs.statSync(fullPath)

      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules' &&
        item !== 'dist'
      ) {
        walk(fullPath)
      } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
        files.push(fullPath)
      }
    }
  }

  walk(dir)
  return files
}

// Fichiers prioritaires avec le plus de "as any"
const priorityFiles = [
  'apps/api/src/domains/auth/security/guards/resource-ownership.guard.ts',
  'apps/api/src/domains/auth/security/guards/enhanced-roles.guard.ts',
  'apps/api/src/domains/auth/security/guards/jwt-auth.guard.ts',
  'apps/api/src/core/common/middleware/enhanced.middleware.ts',
  'apps/api/src/domains/materials/entities/material.entity.ts',
  'apps/api/src/domains/auth/external/controllers/sessions.controller.ts',
  'apps/api/src/core/health/health.controller.ts',
  'apps/api/src/core/common/repositories/base.repository.ts',
  'apps/api/src/core/common/services/enhanced-database.service.ts',
  'apps/api/src/core/common/interceptors/tenant-injection.interceptor.ts',
]

let _totalFixed = 0

// Corriger les fichiers prioritaires
priorityFiles.forEach((file) => {
  const fullPath = path.resolve(file)
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath)) {
      _totalFixed++
    }
  }
})

// Corriger tous les autres fichiers
const allFiles = [...findAllTsFiles('./apps'), ...findAllTsFiles('./packages')]

allFiles.forEach((file) => {
  if (fixFile(file)) {
    _totalFixed++
  }
})

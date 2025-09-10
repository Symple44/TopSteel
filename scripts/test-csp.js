#!/usr/bin/env node

/**
 * CSP Testing Script
 *
 * This script tests the CSP implementation across the application
 * Run with: node scripts/test-csp.js
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.join(__dirname, '..')
const configFiles = [
  'security.config.json',
  'apps/api/src/app/main.ts',
  'apps/web/src/middleware.ts',
  'apps/web/next.config.ts',
]

let unsafeInlineFound = false
for (const file of configFiles) {
  const filePath = path.join(rootDir, file)
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8')
    if (content.includes("'unsafe-inline'")) {
      unsafeInlineFound = true
    } else {
    }
  }
}

if (!unsafeInlineFound) {
}
try {
  const result = execSync(
    'grep -r "style={" apps/web/src --include="*.tsx" --include="*.jsx" | head -20',
    {
      encoding: 'utf8',
      stdio: 'pipe',
    }
  )

  const lines = result
    .trim()
    .split('\n')
    .filter((line) => line.trim())
  if (lines.length > 0) {
    lines.slice(0, 5).forEach((line) => {
      const [_file, ..._rest] = line.split(':')
    })
    if (lines.length > 5) {
    }
  } else {
  }
} catch (_error) {}
const nonceUtilsPath = path.join(rootDir, 'apps/web/src/lib/security/csp-nonce.ts')
const cspStylePath = path.join(rootDir, 'apps/web/src/components/security/csp-style.tsx')

if (fs.existsSync(nonceUtilsPath)) {
} else {
}

if (fs.existsSync(cspStylePath)) {
} else {
}
const securityModulePath = path.join(rootDir, 'apps/api/src/core/security/security.module.ts')
const cspServicePath = path.join(rootDir, 'apps/api/src/core/security/csp-nonce.service.ts')
const violationControllerPath = path.join(
  rootDir,
  'apps/api/src/core/security/csp-violations.controller.ts'
)

if (fs.existsSync(securityModulePath)) {
} else {
}

if (fs.existsSync(cspServicePath)) {
} else {
}

if (fs.existsSync(violationControllerPath)) {
} else {
}
const middlewarePath = path.join(rootDir, 'apps/web/src/middleware.ts')
if (fs.existsSync(middlewarePath)) {
  const middlewareContent = fs.readFileSync(middlewarePath, 'utf8')

  if (middlewareContent.includes(`nonce-\${nonce}`)) {
  } else {
  }

  if (middlewareContent.includes('report-uri')) {
  } else {
  }

  if (middlewareContent.includes('strict-dynamic')) {
  } else {
  }
}
if (unsafeInlineFound) {
} else {
}

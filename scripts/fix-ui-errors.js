#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Fichiers à corriger dans le package UI
const fixes = [
  {
    file: 'packages/ui/src/components/layout/card/Card.tsx',
    patterns: [
      {
        find: /onClick\(e as unknown\)/g,
        replace: 'onClick(e as any)',
      },
      {
        find: /\(e\.key === 'Enter' \|\| e\.key === ' '\) && onClick\(e as unknown\)/g,
        replace: "(e.key === 'Enter' || e.key === ' ') && onClick(e as any)",
      },
    ],
  },
]

function applyFixes() {
  let totalFixed = 0

  for (const fix of fixes) {
    const filePath = path.resolve(fix.file)

    if (!fs.existsSync(filePath)) {
      continue
    }

    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content

    for (const pattern of fix.patterns) {
      content = content.replace(pattern.find, pattern.replace)
    }

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      totalFixed++
    }
  }

  return totalFixed
}

const _fixed = applyFixes()

#!/usr/bin/env node

/**
 * Comprehensive script to fix all React 19 UI import issues
 * Replaces direct @erp/ui imports with @/lib/ui-exports across the entire web app
 */

const fs = require('node:fs')
const path = require('node:path')

function findAllTsxFiles(dir, filelist = []) {
  const files = fs.readdirSync(dir)

  files.forEach((file) => {
    const filepath = path.join(dir, file)
    const stat = fs.statSync(filepath)

    if (stat.isDirectory() && !file.includes('node_modules') && !file.includes('.next')) {
      filelist = findAllTsxFiles(filepath, filelist)
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      // Skip type definition files and certain special files
      if (
        !file.endsWith('.d.ts') &&
        !file.includes('ui-exports') &&
        !file.includes('react-19-ui-components') &&
        !file.includes('types/react-')
      ) {
        filelist.push(filepath)
      }
    }
  })

  return filelist
}

function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')

    // Skip if already uses ui-exports
    if (content.includes("from '@/lib/ui-exports'")) {
      return false
    }

    // Check if file imports from @erp/ui
    if (!content.includes("from '@erp/ui'")) {
      return false
    }

    const originalContent = content

    // Replace all @erp/ui imports with @/lib/ui-exports
    content = content.replace(
      /import\s*{([^}]+)}\s*from\s*['"]@erp\/ui['"]/g,
      "import {$1} from '@/lib/ui-exports'"
    )

    // Also handle any export * from '@erp/ui' statements
    content = content.replace(
      /export\s*\*\s*from\s*['"]@erp\/ui['"]/g,
      "export * from '@/lib/ui-exports'"
    )

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      return true
    }

    return false
  } catch (_error) {
    return false
  }
}

const sourceDir = path.join(__dirname, 'src')
const allFiles = findAllTsxFiles(sourceDir)

let _updatedCount = 0
let checkedCount = 0

allFiles.forEach((filePath) => {
  checkedCount++
  if (updateFile(filePath)) {
    _updatedCount++
  }

  // Show progress every 50 files
  if (checkedCount % 50 === 0) {
  }
})

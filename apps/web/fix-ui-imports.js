#!/usr/bin/env node

/**
 * Script to fix React 19 UI import issues
 * Replaces direct @erp/ui imports with @/lib/ui-exports
 */

const fs = require('node:fs')
const path = require('node:path')

// Files to update (excluding the ones that should keep @erp/ui imports)
const filesToUpdate = [
  // Auth components
  'src/app/(auth)/forgot-password/page.tsx',
  'src/app/(auth)/register/page.tsx',
  'src/components/auth/mfa-verification.tsx',

  // Layout components
  'src/components/layout/sidebar.tsx',
  'src/components/layout/header.tsx',

  // App components
  'src/app/(dashboard)/admin/page.tsx',
  'src/app/(dashboard)/page.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(dashboard)/profile/page.tsx',

  // Admin components
  'src/components/admin/translation-admin.tsx',
  'src/components/admin/company-settings.tsx',
  'src/components/admin/role-management-panel.tsx',

  // Partners
  'src/components/partners/partner-form-dialog.tsx',
  'src/components/partners/partner-detail-dialog.tsx',

  // Other critical components
  'src/app/providers.tsx',
  'src/components/error-boundary.tsx',
]

function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath)

  if (!fs.existsSync(fullPath)) {
    return
  }

  try {
    let content = fs.readFileSync(fullPath, 'utf8')

    // Skip if already uses ui-exports
    if (content.includes("from '@/lib/ui-exports'")) {
      return
    }

    // Skip type definition files and components files
    if (
      filePath.includes('.d.ts') ||
      filePath.includes('ui-exports.ts') ||
      filePath.includes('react-19-ui-components.tsx')
    ) {
      return
    }

    // Replace the import
    const originalContent = content
    content = content.replace(
      /import\s*{([^}]+)}\s*from\s*['"]@erp\/ui['"]/g,
      "import {$1} from '@/lib/ui-exports'"
    )

    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8')
    } else {
    }
  } catch (_error) {}
}

filesToUpdate.forEach(updateFile)

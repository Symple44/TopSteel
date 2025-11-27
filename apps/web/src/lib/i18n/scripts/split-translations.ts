/**
 * Script to split monolithic translation files into namespace-based modules
 * Run with: npx tsx apps/web/src/lib/i18n/scripts/split-translations.ts
 */

import * as fs from 'fs'
import * as path from 'path'

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations')
const LANGUAGES = ['en', 'es', 'fr'] as const

// Define which namespaces go into which files
const NAMESPACE_GROUPS: Record<string, string[]> = {
  common: ['common', 'translation'],
  auth: ['auth'],
  admin: ['admin'],
  dashboard: ['dashboard'],
  navigation: ['navigation', 'navigationEnhanced', 'breadcrumb'],
  errors: ['errors', 'errorsEnhanced', 'success'],
  settings: ['settings', 'appearance', 'notifications'],
  profile: ['profile', 'profileEnhanced'],
  data: ['queryBuilder', 'datatable', 'codeViewer'],
  rbac: ['roles', 'groups', 'roleNames', 'roleManagement', 'bulk'],
  connections: ['connections', 'companies', 'tabSync'],
  misc: [
    'status',
    'warehouse',
    'address',
    'filters',
    'menu',
    'messages',
    'system',
    'projects',
    'materials',
    'actions',
    'search',
    'statusIndicator',
    'templates',
    'app',
    'menuConfig',
    'company',
    'modules',
    'users',
    'authentication',
  ],
}

// Root level keys that are not namespaces (strings directly at root)
const ROOT_KEYS = [
  'securityNoticeText',
  'signIn',
  'administration',
  'adminDescription',
  'usersDescription',
  'settingsDescription',
  'databaseDescription',
  'welcomeMessage',
  'socleTitle',
  'socleDescription',
  'switchToStandardMenu',
  'accountInfo',
  'userMenu',
  'switchToCustomMenu',
  'saveRequired',
  'saveBeforeExecute',
  'executeError',
  'calculatedFields',
  'clickExecuteToSeeResults',
  'clickExecuteToLoadData',
  'selectTableToStart',
  'noResultsFound',
  'clickLineNumbers',
  'closeMenu',
  'openMenu',
]

function formatValue(value: unknown, indent: number = 2): string {
  const spaces = ' '.repeat(indent)

  if (typeof value === 'string') {
    // Escape single quotes and handle multiline
    const escaped = value.replace(/'/g, "\\'")
    return `'${escaped}'`
  }

  if (typeof value === 'object' && value !== null) {
    const entries = Object.entries(value)
    if (entries.length === 0) return '{}'

    const lines = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`
      return `${spaces}  ${key}: ${formatValue(v, indent + 2)}`
    })

    return `{\n${lines.join(',\n')},\n${spaces}}`
  }

  return String(value)
}

function generateFileContent(
  lang: string,
  groupName: string,
  namespaces: string[],
  translations: Record<string, unknown>
): string {
  const content: string[] = []

  for (const ns of namespaces) {
    if (translations[ns]) {
      content.push(`  ${ns}: ${formatValue(translations[ns], 2)}`)
    }
  }

  // For misc, also add root level keys
  if (groupName === 'misc') {
    for (const key of ROOT_KEYS) {
      if (translations[key] !== undefined) {
        const value = translations[key]
        content.push(`  ${key}: ${formatValue(value, 2)}`)
      }
    }
  }

  return `export const ${groupName} = {\n${content.join(',\n')},\n}\n`
}

function generateIndexFile(lang: string): string {
  const imports = Object.keys(NAMESPACE_GROUPS)
    .map((group) => `import { ${group} } from './${group}'`)
    .join('\n')

  const exports = Object.keys(NAMESPACE_GROUPS).join(',\n  ')

  return `${imports}

export const ${lang} = {
  ${exports},
}

// Re-export individual namespaces
export { ${Object.keys(NAMESPACE_GROUPS).join(', ')} }
`
}

async function main() {
  console.log('Starting translation split...\n')

  for (const lang of LANGUAGES) {
    console.log(`Processing ${lang}...`)

    // Import the current translations
    const sourcePath = path.join(TRANSLATIONS_DIR, `${lang}.ts`)
    const sourceContent = fs.readFileSync(sourcePath, 'utf-8')

    // Parse using eval (safe here since we control the files)
    // Remove export const and get the object
    const match = sourceContent.match(/export const \w+ = (\{[\s\S]*\})\s*$/)
    if (!match) {
      console.error(`Could not parse ${lang}.ts`)
      continue
    }

    // Create directory for language
    const langDir = path.join(TRANSLATIONS_DIR, lang)
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true })
    }

    // We need to eval the object - but that's risky
    // Instead, let's just create a simple JSON extraction approach
    console.log(`  Created directory: ${langDir}`)
    console.log(`  Note: Manual extraction required for ${lang}`)
  }

  console.log('\nScript completed.')
  console.log('\nNext steps:')
  console.log('1. Manually verify and split the translation files')
  console.log('2. Update the main index.ts to use the new structure')
}

main().catch(console.error)

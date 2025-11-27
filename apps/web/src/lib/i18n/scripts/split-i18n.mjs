/**
 * Script to split translation files into namespaces
 * Run: node apps/web/src/lib/i18n/scripts/split-i18n.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations')

// Namespace groupings
const NAMESPACE_GROUPS = {
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
    'status', 'warehouse', 'address', 'filters', 'menu', 'messages',
    'system', 'projects', 'materials', 'actions', 'search',
    'statusIndicator', 'templates', 'app', 'menuConfig', 'company',
    'modules', 'users', 'authentication',
  ],
}

// Root level string keys (not namespaces)
const ROOT_KEYS = [
  'securityNoticeText', 'signIn', 'administration', 'adminDescription',
  'usersDescription', 'settingsDescription', 'databaseDescription',
  'welcomeMessage', 'socleTitle', 'socleDescription', 'switchToStandardMenu',
  'accountInfo', 'userMenu', 'switchToCustomMenu', 'saveRequired',
  'saveBeforeExecute', 'executeError', 'calculatedFields',
  'clickExecuteToSeeResults', 'clickExecuteToLoadData', 'selectTableToStart',
  'noResultsFound', 'clickLineNumbers', 'closeMenu', 'openMenu',
]

function stringify(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  const nextSpaces = '  '.repeat(indent + 1)

  if (typeof obj === 'string') {
    // Handle strings with quotes
    if (obj.includes("'") && !obj.includes('"')) {
      return `"${obj}"`
    }
    return `'${obj.replace(/'/g, "\\'")}'`
  }

  if (typeof obj !== 'object' || obj === null) {
    return String(obj)
  }

  const entries = Object.entries(obj)
  if (entries.length === 0) return '{}'

  const lines = entries.map(([key, value]) => {
    // Quote keys with special characters
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`
    return `${nextSpaces}${safeKey}: ${stringify(value, indent + 1)}`
  })

  return `{\n${lines.join(',\n')},\n${spaces}}`
}

function generateFile(groupName, namespaces, translations) {
  const exports = []

  for (const ns of namespaces) {
    if (translations[ns] !== undefined) {
      exports.push(`export const ${ns} = ${stringify(translations[ns])}`)
    }
  }

  // Handle root keys for misc group
  if (groupName === 'misc') {
    const rootObj = {}
    for (const key of ROOT_KEYS) {
      if (translations[key] !== undefined) {
        rootObj[key] = translations[key]
      }
    }
    if (Object.keys(rootObj).length > 0) {
      exports.push(`export const rootKeys = ${stringify(rootObj)}`)
    }
  }

  return exports.join('\n\n') + '\n'
}

function generateIndexFile(lang, groups) {
  const imports = []
  const allExports = []
  const spreadParts = []

  for (const [groupName, namespaces] of Object.entries(groups)) {
    const existingNs = namespaces.filter(ns => allExports.includes(ns) === false)
    if (existingNs.length > 0) {
      imports.push(`import { ${existingNs.join(', ')}${groupName === 'misc' ? ', rootKeys' : ''} } from './${groupName}'`)
      allExports.push(...existingNs)
      spreadParts.push(...existingNs)
      if (groupName === 'misc') {
        spreadParts.push('...rootKeys')
      }
    }
  }

  return `${imports.join('\n')}

export const ${lang} = {
  ${spreadParts.join(',\n  ')},
}
`
}

async function processLanguage(lang) {
  console.log(`\nProcessing ${lang}...`)

  // Dynamically import the translation file
  const sourcePath = path.join(TRANSLATIONS_DIR, `${lang}.ts`)

  // Read as text and extract the object using regex
  const content = fs.readFileSync(sourcePath, 'utf-8')

  // Use Function constructor to evaluate (safer than eval)
  const match = content.match(/export const \w+ = (\{[\s\S]*\})\s*$/m)
  if (!match) {
    console.error(`  Could not parse ${lang}.ts - pattern not found`)
    return
  }

  let translations
  try {
    // Create a function that returns the object
    translations = new Function(`return ${match[1]}`)()
  } catch (err) {
    console.error(`  Error parsing ${lang}.ts:`, err.message)
    return
  }

  // Create output directory
  const outDir = path.join(TRANSLATIONS_DIR, lang)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  // Generate files for each group
  const validGroups = {}
  for (const [groupName, namespaces] of Object.entries(NAMESPACE_GROUPS)) {
    const hasContent = namespaces.some(ns => translations[ns] !== undefined) ||
      (groupName === 'misc' && ROOT_KEYS.some(k => translations[k] !== undefined))

    if (hasContent) {
      const fileContent = generateFile(groupName, namespaces, translations)
      const filePath = path.join(outDir, `${groupName}.ts`)
      fs.writeFileSync(filePath, fileContent)
      console.log(`  Created: ${lang}/${groupName}.ts`)
      validGroups[groupName] = namespaces.filter(ns => translations[ns] !== undefined)
    }
  }

  // Generate index file
  const indexContent = generateIndexFile(lang, validGroups)
  fs.writeFileSync(path.join(outDir, 'index.ts'), indexContent)
  console.log(`  Created: ${lang}/index.ts`)
}

async function main() {
  console.log('=== i18n Split Tool ===')

  for (const lang of ['en', 'fr', 'es']) {
    await processLanguage(lang)
  }

  // Update main index.ts
  const mainIndex = `import type { Translations } from '../types'
import { en } from './en'
import { es } from './es'
import { fr } from './fr'

export const translations: Translations = {
  fr,
  en,
  es,
}

export { fr, en, es }
`

  fs.writeFileSync(path.join(TRANSLATIONS_DIR, 'index.ts'), mainIndex)
  console.log('\nUpdated: translations/index.ts')

  console.log('\n=== Done! ===')
  console.log('\nNext steps:')
  console.log('1. Review the generated files')
  console.log('2. Run type check: pnpm --filter web typecheck')
  console.log('3. Delete old monolithic files: en.ts, fr.ts, es.ts')
}

main().catch(console.error)

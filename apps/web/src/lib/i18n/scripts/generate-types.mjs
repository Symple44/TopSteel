/**
 * Generates TypeScript types for i18n keys from French translations (reference)
 * Run: node apps/web/src/lib/i18n/scripts/generate-types.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations', 'fr')
const OUTPUT_FILE = path.join(__dirname, '..', 'generated-types.ts')

/**
 * Recursively extract all keys from an object with dot notation
 */
function extractKeys(obj, prefix = '') {
  const keys = []

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      // Recurse into nested objects
      keys.push(...extractKeys(value, fullKey))
    } else {
      // Leaf node - this is a translatable string
      keys.push(fullKey)
    }
  }

  return keys
}

/**
 * Load all French translation modules
 */
async function loadTranslations() {
  const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts')
  const allTranslations = {}

  for (const file of files) {
    const filePath = path.join(TRANSLATIONS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    // Extract all exports from the file
    const exportMatches = content.matchAll(/export const (\w+) = (\{[\s\S]*?\n\})/g)

    for (const match of exportMatches) {
      const [, name, objStr] = match
      try {
        const obj = new Function(`return ${objStr}`)()
        allTranslations[name] = obj
      } catch (e) {
        console.warn(`  Warning: Could not parse ${name} in ${file}`)
      }
    }
  }

  return allTranslations
}

/**
 * Generate TypeScript type definitions
 */
function generateTypes(translations) {
  const allKeys = []

  for (const [namespace, content] of Object.entries(translations)) {
    if (typeof content === 'object' && content !== null) {
      const keys = extractKeys(content, namespace)
      allKeys.push(...keys)
    } else if (typeof content === 'string') {
      // Root level string
      allKeys.push(namespace)
    }
  }

  // Sort keys for consistent output
  allKeys.sort()

  const lines = [
    '/**',
    ' * Auto-generated i18n types - DO NOT EDIT MANUALLY',
    ` * Generated from French translations (reference language)`,
    ` * Run: node apps/web/src/lib/i18n/scripts/generate-types.mjs`,
    ` * Generated: ${new Date().toISOString()}`,
    ' */',
    '',
    '// All available translation keys',
    'export type TranslationKey =',
  ]

  // Add keys as union type
  for (let i = 0; i < allKeys.length; i++) {
    const key = allKeys[i]
    lines.push(`  | '${key}'`)
  }

  lines.push('')

  // Add helper types
  lines.push('// Helper type to extract namespace from key')
  lines.push("export type I18nNamespace = TranslationKey extends `${infer NS}.${string}` ? NS : never")
  lines.push('')
  lines.push('// Type-safe translation parameters')
  lines.push('export type TranslationParams = Record<string, string | number>')
  lines.push('')
  lines.push('// Total count of translation keys')
  lines.push(`export const TRANSLATION_KEY_COUNT = ${allKeys.length} as const`)
  lines.push('')

  return lines.join('\n')
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

async function main() {
  console.log('=== i18n Type Generator ===\n')

  console.log('Loading French translations...')
  const translations = await loadTranslations()

  const namespaceCount = Object.keys(translations).length
  console.log(`  Found ${namespaceCount} namespaces`)

  console.log('\nGenerating types...')
  const types = generateTypes(translations)

  fs.writeFileSync(OUTPUT_FILE, types)
  console.log(`  Written to: ${OUTPUT_FILE}`)

  // Count keys
  const keyCount = (types.match(/\| '/g) || []).length
  console.log(`  Total keys: ${keyCount}`)

  console.log('\n=== Done! ===')
}

main().catch(console.error)

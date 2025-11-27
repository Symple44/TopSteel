/**
 * Synchronizes missing translation keys from French (reference) to other languages
 * Adds placeholder text for missing translations
 * Run: node apps/web/src/lib/i18n/scripts/sync-translations.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations')
const REFERENCE_LANG = 'fr'
const TARGET_LANGUAGES = ['en', 'es']
const PLACEHOLDER_PREFIX = '[TODO] '

/**
 * Extract all keys from an object recursively
 */
function extractKeys(obj, prefix = '') {
  const keys = new Map()

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const nested = extractKeys(value, fullKey)
      for (const [k, v] of nested) {
        keys.set(k, v)
      }
    } else if (typeof value === 'string') {
      keys.set(fullKey, value)
    }
  }

  return keys
}

/**
 * Set a nested value in an object using dot notation
 */
function setNestedValue(obj, path, value) {
  const keys = path.split('.')
  let current = obj

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current)) {
      current[key] = {}
    } else if (typeof current[key] !== 'object' || current[key] === null) {
      // Skip if there's a type conflict (string vs object)
      return false
    }
    current = current[key]
  }

  current[keys[keys.length - 1]] = value
  return true
}

/**
 * Load translations for a language from a specific file
 */
function loadTranslationFile(lang, filename) {
  const filePath = path.join(TRANSLATIONS_DIR, lang, filename)
  if (!fs.existsSync(filePath)) return {}

  const content = fs.readFileSync(filePath, 'utf-8')
  const result = {}

  const exportMatches = content.matchAll(/export const (\w+) = (\{[\s\S]*?\n\})/g)

  for (const match of exportMatches) {
    const [, name, objStr] = match
    try {
      result[name] = new Function(`return ${objStr}`)()
    } catch (e) {
      // Skip parse errors
    }
  }

  return result
}

/**
 * Format object to TypeScript string
 */
function formatObject(obj, indent = 0) {
  const spaces = '  '.repeat(indent)
  const nextSpaces = '  '.repeat(indent + 1)

  if (typeof obj === 'string') {
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
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `'${key}'`
    return `${nextSpaces}${safeKey}: ${formatObject(value, indent + 1)}`
  })

  return `{\n${lines.join(',\n')},\n${spaces}}`
}

/**
 * Sync a specific file
 */
function syncFile(filename, refTranslations, targetLang) {
  const targetTranslations = loadTranslationFile(targetLang, filename)
  let hasChanges = false
  const addedKeys = []

  for (const [namespace, content] of Object.entries(refTranslations)) {
    if (typeof content !== 'object') continue

    if (!targetTranslations[namespace]) {
      targetTranslations[namespace] = {}
    }

    const refKeys = extractKeys(content, '')
    const targetKeys = extractKeys(targetTranslations[namespace], '')

    for (const [key, value] of refKeys) {
      if (!targetKeys.has(key)) {
        // Add missing key with placeholder
        const placeholderValue = `${PLACEHOLDER_PREFIX}${value}`
        const success = setNestedValue(targetTranslations[namespace], key, placeholderValue)
        if (success) {
          addedKeys.push(`${namespace}.${key}`)
          hasChanges = true
        }
      }
    }
  }

  if (hasChanges) {
    // Write updated file
    const filePath = path.join(TRANSLATIONS_DIR, targetLang, filename)
    const exports = Object.entries(targetTranslations)
      .map(([name, obj]) => `export const ${name} = ${formatObject(obj)}`)
      .join('\n\n')

    fs.writeFileSync(filePath, exports + '\n')
  }

  return { hasChanges, addedKeys }
}

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  console.log('=== i18n Sync Tool ===')
  if (dryRun) console.log('(Dry run mode - no files will be modified)\n')

  // Get all translation files from reference
  const refDir = path.join(TRANSLATIONS_DIR, REFERENCE_LANG)
  const files = fs.readdirSync(refDir).filter(f => f.endsWith('.ts') && f !== 'index.ts')

  let totalAdded = 0

  for (const targetLang of TARGET_LANGUAGES) {
    console.log(`\n[${targetLang.toUpperCase()}]`)
    console.log('─'.repeat(40))

    for (const file of files) {
      const refTranslations = loadTranslationFile(REFERENCE_LANG, file)

      if (dryRun) {
        // Just report what would be added
        const targetTranslations = loadTranslationFile(targetLang, file)
        let wouldAdd = 0

        for (const [namespace, content] of Object.entries(refTranslations)) {
          if (typeof content !== 'object') continue
          const refKeys = extractKeys(content, '')
          const targetKeys = extractKeys(targetTranslations[namespace] || {}, '')

          for (const key of refKeys.keys()) {
            if (!targetKeys.has(key)) wouldAdd++
          }
        }

        if (wouldAdd > 0) {
          console.log(`  ${file}: ${wouldAdd} keys to add`)
          totalAdded += wouldAdd
        }
      } else {
        const { hasChanges, addedKeys } = syncFile(file, refTranslations, targetLang)

        if (hasChanges) {
          console.log(`  ${file}: +${addedKeys.length} keys`)
          totalAdded += addedKeys.length
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(40))

  if (dryRun) {
    console.log(`Would add ${totalAdded} translations`)
    console.log('\nRun without --dry-run to apply changes')
  } else if (totalAdded > 0) {
    console.log(`✅ Added ${totalAdded} placeholder translations`)
    console.log('\nSearch for "[TODO]" to find translations that need work')
  } else {
    console.log('✅ All translations are in sync!')
  }
}

main().catch(console.error)

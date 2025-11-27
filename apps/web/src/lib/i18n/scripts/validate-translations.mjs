/**
 * Validates translations across all languages
 * Detects: missing keys, extra keys, inconsistent parameters
 * Run: node apps/web/src/lib/i18n/scripts/validate-translations.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations')
const REFERENCE_LANG = 'fr' // French is the reference language
const LANGUAGES = ['fr', 'en', 'es']

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
 * Extract parameters from a translation string ({{param}} or {param})
 */
function extractParams(str) {
  const params = new Set()
  const matches = str.matchAll(/\{\{?(\w+)\}?\}/g)
  for (const match of matches) {
    params.add(match[1])
  }
  return params
}

/**
 * Load translations for a language
 */
function loadLanguage(lang) {
  const langDir = path.join(TRANSLATIONS_DIR, lang)
  const files = fs.readdirSync(langDir).filter(f => f.endsWith('.ts') && f !== 'index.ts')
  const allTranslations = {}

  for (const file of files) {
    const filePath = path.join(langDir, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    const exportMatches = content.matchAll(/export const (\w+) = (\{[\s\S]*?\n\})/g)

    for (const match of exportMatches) {
      const [, name, objStr] = match
      try {
        const obj = new Function(`return ${objStr}`)()
        allTranslations[name] = obj
      } catch (e) {
        // Skip parse errors
      }
    }
  }

  return allTranslations
}

/**
 * Compare two languages and find issues
 */
function compareLanguages(refLang, refKeys, targetLang, targetKeys) {
  const issues = {
    missing: [],
    extra: [],
    paramMismatch: [],
  }

  // Find missing keys
  for (const [key, value] of refKeys) {
    if (!targetKeys.has(key)) {
      issues.missing.push(key)
    } else {
      // Check parameter consistency
      const refParams = extractParams(value)
      const targetParams = extractParams(targetKeys.get(key))

      const missingParams = [...refParams].filter(p => !targetParams.has(p))
      const extraParams = [...targetParams].filter(p => !refParams.has(p))

      if (missingParams.length > 0 || extraParams.length > 0) {
        issues.paramMismatch.push({
          key,
          missing: missingParams,
          extra: extraParams,
        })
      }
    }
  }

  // Find extra keys (in target but not in reference)
  for (const key of targetKeys.keys()) {
    if (!refKeys.has(key)) {
      issues.extra.push(key)
    }
  }

  return issues
}

async function main() {
  console.log('=== i18n Validation Tool ===\n')

  // Load all languages
  const translations = {}
  const keyMaps = {}

  for (const lang of LANGUAGES) {
    console.log(`Loading ${lang}...`)
    translations[lang] = loadLanguage(lang)

    // Flatten all keys
    const allKeys = new Map()
    for (const [ns, content] of Object.entries(translations[lang])) {
      if (typeof content === 'object') {
        const keys = extractKeys(content, ns)
        for (const [k, v] of keys) {
          allKeys.set(k, v)
        }
      }
    }
    keyMaps[lang] = allKeys
    console.log(`  Found ${allKeys.size} keys`)
  }

  console.log('\n--- Validation Results ---\n')

  let hasErrors = false
  const refKeys = keyMaps[REFERENCE_LANG]

  for (const lang of LANGUAGES) {
    if (lang === REFERENCE_LANG) continue

    console.log(`\n[${lang.toUpperCase()}] vs [${REFERENCE_LANG.toUpperCase()}] (reference)`)
    console.log('─'.repeat(40))

    const issues = compareLanguages(REFERENCE_LANG, refKeys, lang, keyMaps[lang])

    if (issues.missing.length > 0) {
      hasErrors = true
      console.log(`\n❌ Missing keys (${issues.missing.length}):`)
      for (const key of issues.missing.slice(0, 10)) {
        console.log(`   - ${key}`)
      }
      if (issues.missing.length > 10) {
        console.log(`   ... and ${issues.missing.length - 10} more`)
      }
    }

    if (issues.extra.length > 0) {
      console.log(`\n⚠️  Extra keys (${issues.extra.length}):`)
      for (const key of issues.extra.slice(0, 5)) {
        console.log(`   - ${key}`)
      }
      if (issues.extra.length > 5) {
        console.log(`   ... and ${issues.extra.length - 5} more`)
      }
    }

    if (issues.paramMismatch.length > 0) {
      hasErrors = true
      console.log(`\n❌ Parameter mismatches (${issues.paramMismatch.length}):`)
      for (const item of issues.paramMismatch.slice(0, 5)) {
        console.log(`   - ${item.key}`)
        if (item.missing.length) console.log(`     Missing: ${item.missing.join(', ')}`)
        if (item.extra.length) console.log(`     Extra: ${item.extra.join(', ')}`)
      }
      if (issues.paramMismatch.length > 5) {
        console.log(`   ... and ${issues.paramMismatch.length - 5} more`)
      }
    }

    if (issues.missing.length === 0 && issues.paramMismatch.length === 0) {
      console.log('\n✅ All keys present and parameters match!')
    }

    // Summary
    const coverage = ((refKeys.size - issues.missing.length) / refKeys.size * 100).toFixed(1)
    console.log(`\n📊 Coverage: ${coverage}%`)
  }

  console.log('\n' + '═'.repeat(40))
  console.log('=== Validation Complete ===')

  if (hasErrors) {
    console.log('\n⚠️  Issues found. Consider fixing missing translations.')
    process.exit(1)
  } else {
    console.log('\n✅ All translations are valid!')
  }
}

main().catch(console.error)

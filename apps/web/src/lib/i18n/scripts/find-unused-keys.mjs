/**
 * Finds unused translation keys in the codebase
 * Cross-platform version (Node.js native, no grep dependency)
 * Run: node apps/web/src/lib/i18n/scripts/find-unused-keys.mjs
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'translations', 'fr')
// Go up from scripts -> i18n -> lib -> src (we're in apps/web/src/lib/i18n/scripts)
const SRC_DIR = path.resolve(__dirname, '..', '..', '..', '..')
const EXCLUDED_DIRS = ['node_modules', '.next', 'dist', '.git', 'coverage', '__tests__']
const FILE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx']

/**
 * Extract all keys from translation files
 */
function extractAllKeys() {
  const files = fs.readdirSync(TRANSLATIONS_DIR).filter(f => f.endsWith('.ts') && f !== 'index.ts')
  const allKeys = new Set()

  for (const file of files) {
    const filePath = path.join(TRANSLATIONS_DIR, file)
    const content = fs.readFileSync(filePath, 'utf-8')

    const exportMatches = content.matchAll(/export const (\w+) = (\{[\s\S]*?\n\})/g)

    for (const match of exportMatches) {
      const [, namespace, objStr] = match
      try {
        const obj = new Function(`return ${objStr}`)()
        extractKeysFromObject(obj, namespace, allKeys)
      } catch (e) {
        // Skip parse errors
      }
    }
  }

  return allKeys
}

function extractKeysFromObject(obj, prefix, keys) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      extractKeysFromObject(value, fullKey, keys)
    } else if (typeof value === 'string') {
      keys.add(fullKey)
    }
  }
}

/**
 * Recursively get all source files
 */
function getAllSourceFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files

  const entries = fs.readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.includes(entry.name)) {
        getAllSourceFiles(fullPath, files)
      }
    } else if (entry.isFile() && FILE_EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
      // Exclude translation files
      if (!fullPath.includes('translations') && !fullPath.includes('i18n/scripts')) {
        files.push(fullPath)
      }
    }
  }

  return files
}

/**
 * Search for key usage in all source files
 */
function findUsedKeys(allKeys, sourceFiles) {
  const usedKeys = new Set()
  const fileContents = new Map()

  // Load all file contents once
  console.log(`  Loading ${sourceFiles.length} source files...`)
  for (const file of sourceFiles) {
    try {
      fileContents.set(file, fs.readFileSync(file, 'utf-8'))
    } catch (e) {
      // Skip unreadable files
    }
  }

  console.log(`  Scanning ${allKeys.size} keys...`)
  let processed = 0

  for (const key of allKeys) {
    processed++
    if (processed % 200 === 0) {
      process.stdout.write(`\r  Progress: ${processed}/${allKeys.size}`)
    }

    // Search patterns
    const patterns = [
      `'${key}'`,
      `"${key}"`,
      `\`${key}\``,
    ]

    for (const [, content] of fileContents) {
      for (const pattern of patterns) {
        if (content.includes(pattern)) {
          usedKeys.add(key)
          break
        }
      }
      if (usedKeys.has(key)) break
    }
  }

  console.log(`\r  Progress: ${allKeys.size}/${allKeys.size}`)
  return usedKeys
}

/**
 * Group keys by namespace for better reporting
 */
function groupByNamespace(keys) {
  const groups = new Map()

  for (const key of keys) {
    const [ns] = key.split('.')
    if (!groups.has(ns)) {
      groups.set(ns, [])
    }
    groups.get(ns).push(key)
  }

  return groups
}

async function main() {
  console.log('=== Find Unused Translation Keys ===\n')

  console.log('Loading translation keys...')
  const allKeys = extractAllKeys()
  console.log(`  Found ${allKeys.size} translation keys\n`)

  console.log('Finding source files...')
  const sourceFiles = getAllSourceFiles(SRC_DIR)
  console.log(`  Found ${sourceFiles.length} source files\n`)

  console.log('Searching for usage...')
  const usedKeys = findUsedKeys(allKeys, sourceFiles)

  const unusedKeys = new Set([...allKeys].filter(k => !usedKeys.has(k)))

  console.log('\n' + '─'.repeat(50))
  console.log(`\n📊 Results:`)
  console.log(`  Total keys: ${allKeys.size}`)
  console.log(`  Used keys: ${usedKeys.size}`)
  console.log(`  Potentially unused: ${unusedKeys.size}`)

  if (unusedKeys.size > 0 && unusedKeys.size < allKeys.size * 0.8) {
    console.log(`\n⚠️  Potentially unused keys by namespace:\n`)

    const grouped = groupByNamespace(unusedKeys)
    const sortedGroups = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)

    for (const [ns, keys] of sortedGroups.slice(0, 10)) {
      console.log(`  ${ns}: ${keys.length} keys`)
      for (const key of keys.slice(0, 3)) {
        console.log(`    - ${key}`)
      }
      if (keys.length > 3) {
        console.log(`    ... and ${keys.length - 3} more`)
      }
    }

    if (sortedGroups.length > 10) {
      console.log(`  ... and ${sortedGroups.length - 10} more namespaces`)
    }

    // Write full report to file
    const reportPath = path.join(__dirname, 'unused-keys-report.txt')
    const report = [
      '# Potentially Unused Translation Keys',
      `# Generated: ${new Date().toISOString()}`,
      `# Total: ${unusedKeys.size}`,
      '',
      ...Array.from(unusedKeys).sort()
    ].join('\n')

    fs.writeFileSync(reportPath, report)
    console.log(`\n📄 Full report saved to: unused-keys-report.txt`)
  } else if (unusedKeys.size >= allKeys.size * 0.8) {
    console.log('\n⚠️  Too many keys marked as unused - likely a detection issue.')
    console.log('   Some keys may be dynamically constructed.')
  } else {
    console.log('\n✅ All translation keys appear to be used!')
  }

  console.log('\n⚠️  Note: Some keys may be dynamically constructed or used in ways')
  console.log('   that static analysis cannot detect. Review before deleting.')
}

main().catch(console.error)

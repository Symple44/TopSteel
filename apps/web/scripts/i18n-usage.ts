#!/usr/bin/env npx tsx
/**
 * Script d'analyse d'usage des traductions i18n
 *
 * Usage:
 *   pnpm run i18n:usage    # Analyse les clés utilisées vs définies
 *
 * Ce script aide à identifier:
 * - Clés utilisées dans le code mais non définies dans les traductions
 * - Clés définies mais jamais utilisées dans le code
 */

import * as fs from 'fs'
import * as path from 'path'

// Configuration
const SRC_DIR = path.join(__dirname, '../src')
const TRANSLATIONS_DIR = path.join(__dirname, '../src/lib/i18n/translations')
const REFERENCE_LANG = 'en'

// Couleurs terminal
const c = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
}

interface UsageReport {
  usedKeys: Set<string>
  definedKeys: Set<string>
  missingInTranslations: string[]
  unusedInCode: string[]
  dynamicKeys: string[]
}

/**
 * Extrait les clés de traduction d'un fichier .ts/.tsx
 */
function extractUsedKeysFromFile(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const keys = new Set<string>()

  // Pattern 1: t('key') or t("key")
  const tFunctionPattern = /\bt\s*\(\s*['"`]([^'"`]+)['"`]/g
  let match: RegExpExecArray | null
  while ((match = tFunctionPattern.exec(content)) !== null) {
    keys.add(match[1])
  }

  // Pattern 2: t('namespace.key') with namespace
  // Already captured by pattern 1

  // Pattern 3: useTranslation('namespace') puis t('key')
  const namespacePattern = /useTranslation\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g
  const namespaces: string[] = []
  while ((match = namespacePattern.exec(content)) !== null) {
    namespaces.push(match[1])
  }

  return keys
}

/**
 * Extrait les clés définies dans un fichier de traduction
 */
function extractDefinedKeys(filePath: string): Set<string> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const keys = new Set<string>()

  const pathStack: string[] = []

  const lines = content.split('\n')
  for (const line of lines) {
    // Ouverture d'objet
    const objectStart = line.match(/^\s*(\w+)\s*:\s*\{/)
    if (objectStart) {
      pathStack.push(objectStart[1])
      continue
    }

    // Fermeture d'objet
    const objectEnd = line.match(/^\s*\}/)
    if (objectEnd && pathStack.length > 0) {
      pathStack.pop()
      continue
    }

    // Clé avec valeur string
    const keyValue = line.match(/^\s*(\w+)\s*:\s*['"`]/)
    if (keyValue) {
      const key = keyValue[1]
      const fullPath = pathStack.length > 0 ? `${pathStack.join('.')}.${key}` : key
      keys.add(fullPath)
    }
  }

  return keys
}

/**
 * Parcourt récursivement un répertoire
 */
function walkDir(dir: string, callback: (filePath: string) => void): void {
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!['node_modules', '.next', 'dist', '.git'].includes(file)) {
        walkDir(filePath, callback)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Ignorer les fichiers de traduction eux-mêmes
      if (!filePath.includes('translations')) {
        callback(filePath)
      }
    }
  }
}

/**
 * Analyse l'usage des traductions
 */
function analyzeUsage(): UsageReport {
  const usedKeys = new Set<string>()
  const dynamicKeys: string[] = []

  // 1. Extraire toutes les clés utilisées dans le code
  console.log(`${c.cyan}🔍 Analyse du code source...${c.reset}`)
  let fileCount = 0

  walkDir(SRC_DIR, (filePath) => {
    const keys = extractUsedKeysFromFile(filePath)
    keys.forEach((k) => usedKeys.add(k))
    fileCount++
  })

  console.log(`${c.blue}Fichiers analysés:${c.reset} ${fileCount}`)
  console.log(`${c.blue}Clés trouvées:${c.reset} ${usedKeys.size}`)

  // 2. Extraire les clés définies dans la référence
  console.log(`\n${c.cyan}🔍 Analyse des traductions...${c.reset}`)
  const refPath = path.join(TRANSLATIONS_DIR, `${REFERENCE_LANG}.ts`)
  const definedKeys = extractDefinedKeys(refPath)
  console.log(`${c.blue}Clés définies (${REFERENCE_LANG}):${c.reset} ${definedKeys.size}`)

  // 3. Comparer
  const missingInTranslations: string[] = []
  const unusedInCode: string[] = []

  // Clés utilisées mais non définies
  usedKeys.forEach((key) => {
    // Ignorer les clés dynamiques (avec des variables)
    if (key.includes('${') || key.includes('{') || key.includes('`')) {
      dynamicKeys.push(key)
      return
    }

    // Vérifier si la clé existe (exactement ou comme préfixe)
    let found = false
    if (definedKeys.has(key)) {
      found = true
    } else {
      // Chercher avec préfixes courants
      for (const defined of definedKeys) {
        if (defined.endsWith(`.${key}`) || defined === key) {
          found = true
          break
        }
      }
    }

    if (!found) {
      missingInTranslations.push(key)
    }
  })

  // Clés définies mais non utilisées (approximatif)
  definedKeys.forEach((key) => {
    const keyParts = key.split('.')
    const lastPart = keyParts[keyParts.length - 1]

    let found = false
    for (const used of usedKeys) {
      if (used === key || used === lastPart || key.endsWith(`.${used}`)) {
        found = true
        break
      }
    }

    if (!found) {
      unusedInCode.push(key)
    }
  })

  return {
    usedKeys,
    definedKeys,
    missingInTranslations,
    unusedInCode,
    dynamicKeys,
  }
}

/**
 * Affiche le rapport
 */
function printReport(report: UsageReport): void {
  console.log(`\n${c.bold}${c.cyan}═══════════════════════════════════════════════${c.reset}`)
  console.log(`${c.bold}${c.cyan}   📊 RAPPORT D'USAGE DES TRADUCTIONS${c.reset}`)
  console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════${c.reset}\n`)

  // Résumé
  console.log(`${c.bold}Résumé:${c.reset}`)
  console.log(`  Clés utilisées dans le code: ${report.usedKeys.size}`)
  console.log(`  Clés définies (EN): ${report.definedKeys.size}`)
  console.log(`  ${c.red}Manquantes dans traductions: ${report.missingInTranslations.length}${c.reset}`)
  console.log(`  ${c.yellow}Potentiellement inutilisées: ${report.unusedInCode.length}${c.reset}`)
  console.log(`  ${c.dim}Clés dynamiques ignorées: ${report.dynamicKeys.length}${c.reset}`)

  // Clés manquantes
  if (report.missingInTranslations.length > 0) {
    console.log(`\n${c.bold}${c.red}━━━ Clés utilisées mais NON DÉFINIES ━━━${c.reset}`)
    console.log(`${c.dim}Ces clés sont utilisées dans le code mais n'existent pas dans les traductions:${c.reset}\n`)

    // Grouper par namespace
    const byNamespace = new Map<string, string[]>()
    for (const key of report.missingInTranslations) {
      const parts = key.split('.')
      const ns = parts.length > 1 ? parts[0] : 'root'
      if (!byNamespace.has(ns)) byNamespace.set(ns, [])
      byNamespace.get(ns)!.push(key)
    }

    byNamespace.forEach((keys, ns) => {
      console.log(`${c.cyan}[${ns}]${c.reset} (${keys.length} clés)`)
      keys.slice(0, 10).forEach((k) => {
        console.log(`  ${c.red}✗${c.reset} ${k}`)
      })
      if (keys.length > 10) {
        console.log(`  ${c.dim}... et ${keys.length - 10} autres${c.reset}`)
      }
      console.log('')
    })
  } else {
    console.log(`\n${c.green}✓ Toutes les clés utilisées sont définies dans les traductions${c.reset}`)
  }

  // Clés potentiellement inutilisées (limité car beaucoup de faux positifs)
  if (report.unusedInCode.length > 0 && report.unusedInCode.length < 100) {
    console.log(`\n${c.bold}${c.yellow}━━━ Clés potentiellement INUTILISÉES ━━━${c.reset}`)
    console.log(`${c.dim}Ces clés sont définies mais semblent ne pas être utilisées:${c.reset}`)
    console.log(`${c.dim}(Attention: beaucoup de faux positifs possibles avec clés dynamiques)${c.reset}\n`)

    report.unusedInCode.slice(0, 20).forEach((k) => {
      console.log(`  ${c.yellow}?${c.reset} ${k}`)
    })
    if (report.unusedInCode.length > 20) {
      console.log(`  ${c.dim}... et ${report.unusedInCode.length - 20} autres${c.reset}`)
    }
  }
}

// Main
async function main() {
  const report = analyzeUsage()
  printReport(report)

  // Exit avec erreur si des clés manquent
  if (report.missingInTranslations.length > 0) {
    process.exit(1)
  }
}

main().catch(console.error)

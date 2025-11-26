#!/usr/bin/env npx tsx
/**
 * Script de synchronisation des traductions i18n
 *
 * Usage:
 *   pnpm run i18n:check    # Vérifie les clés manquantes
 *   pnpm run i18n:sync     # Affiche les clés manquantes à ajouter
 *   pnpm run i18n:report   # Génère un rapport Markdown
 *
 * Ce script aide Claude Code à maintenir les traductions synchronisées
 */

import * as fs from 'fs'
import * as path from 'path'

// Configuration
const TRANSLATIONS_DIR = path.join(__dirname, '../src/lib/i18n/translations')
const REFERENCE_LANG = 'en'
const TARGET_LANGS = ['fr', 'es']

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

interface KeyInfo {
  path: string
  value: string
  line?: number
}

interface SyncReport {
  lang: string
  missing: KeyInfo[]
  extra: string[]
  total: number
  coverage: number
}

/**
 * Extrait les clés d'un fichier de traduction via regex
 * Plus robuste que le parsing JSON pour les fichiers TypeScript
 */
function extractKeysFromFile(filePath: string): Map<string, KeyInfo> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const keys = new Map<string, KeyInfo>()

  // Stack pour suivre le chemin courant dans l'objet
  const pathStack: string[] = []
  let currentPath = ''

  const lines = content.split('\n')

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const lineNum = i + 1

    // Détecter les ouvertures d'objets avec clé: {
    const objectStart = line.match(/^\s*(\w+)\s*:\s*\{/)
    if (objectStart) {
      pathStack.push(objectStart[1])
      currentPath = pathStack.join('.')
      continue
    }

    // Détecter les fermetures d'objets }
    const objectEnd = line.match(/^\s*\}/)
    if (objectEnd && pathStack.length > 0) {
      pathStack.pop()
      currentPath = pathStack.join('.')
      continue
    }

    // Détecter les clés avec valeurs string: key: 'value' ou key: "value"
    const keyValue = line.match(/^\s*(\w+)\s*:\s*['"`](.*)['"`]\s*,?\s*$/)
    if (keyValue) {
      const key = keyValue[1]
      const value = keyValue[2]
      const fullPath = currentPath ? `${currentPath}.${key}` : key

      keys.set(fullPath, {
        path: fullPath,
        value: value,
        line: lineNum,
      })
    }

    // Détecter les clés avec valeurs multi-lignes template literals
    const templateStart = line.match(/^\s*(\w+)\s*:\s*`/)
    if (templateStart) {
      const key = templateStart[1]
      let value = line.substring(line.indexOf('`') + 1)

      // Chercher la fin du template literal
      let j = i
      while (!value.includes('`') && j < lines.length - 1) {
        j++
        value += '\n' + lines[j]
      }

      value = value.replace(/`\s*,?\s*$/, '')
      const fullPath = currentPath ? `${currentPath}.${key}` : key

      keys.set(fullPath, {
        path: fullPath,
        value: value,
        line: lineNum,
      })
    }
  }

  return keys
}

/**
 * Compare deux ensembles de clés
 */
function compareKeys(
  reference: Map<string, KeyInfo>,
  target: Map<string, KeyInfo>,
  lang: string
): SyncReport {
  const missing: KeyInfo[] = []
  const extra: string[] = []

  // Clés manquantes
  reference.forEach((info, key) => {
    if (!target.has(key)) {
      missing.push(info)
    }
  })

  // Clés en trop
  target.forEach((_, key) => {
    if (!reference.has(key)) {
      extra.push(key)
    }
  })

  const coverage = ((reference.size - missing.length) / reference.size) * 100

  return {
    lang,
    missing,
    extra,
    total: reference.size,
    coverage,
  }
}

/**
 * Affiche un résumé coloré
 */
function printSummary(reports: SyncReport[]): void {
  console.log(`\n${c.bold}${c.cyan}═══════════════════════════════════════════════${c.reset}`)
  console.log(`${c.bold}${c.cyan}   📊 RAPPORT DE SYNCHRONISATION i18n${c.reset}`)
  console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════${c.reset}\n`)

  console.log(`${c.blue}Référence:${c.reset} ${REFERENCE_LANG.toUpperCase()}`)
  console.log(`${c.blue}Cibles:${c.reset} ${TARGET_LANGS.map(l => l.toUpperCase()).join(', ')}\n`)

  for (const r of reports) {
    const icon = r.coverage >= 95 ? '✅' : r.coverage >= 80 ? '⚠️' : '❌'
    const coverageColor = r.coverage >= 95 ? c.green : r.coverage >= 80 ? c.yellow : c.red

    console.log(`${c.bold}${r.lang.toUpperCase()}${c.reset} ${icon}`)
    console.log(`  Couverture: ${coverageColor}${r.coverage.toFixed(1)}%${c.reset}`)
    console.log(`  Total clés: ${r.total}`)
    console.log(`  ${c.red}Manquantes: ${r.missing.length}${c.reset}`)
    console.log(`  ${c.yellow}En trop: ${r.extra.length}${c.reset}`)
    console.log('')
  }
}

/**
 * Affiche les clés manquantes groupées par section
 */
function printMissingKeys(reports: SyncReport[]): void {
  for (const r of reports) {
    if (r.missing.length === 0) {
      console.log(`${c.green}✓ ${r.lang.toUpperCase()}: Aucune clé manquante${c.reset}\n`)
      continue
    }

    console.log(`\n${c.bold}${c.yellow}━━━ ${r.lang.toUpperCase()}: ${r.missing.length} clés manquantes ━━━${c.reset}\n`)

    // Grouper par section de premier niveau
    const bySection = new Map<string, KeyInfo[]>()
    for (const k of r.missing) {
      const section = k.path.split('.')[0]
      if (!bySection.has(section)) bySection.set(section, [])
      bySection.get(section)!.push(k)
    }

    // Afficher par section
    bySection.forEach((keys, section) => {
      console.log(`${c.cyan}[${section}]${c.reset} (${keys.length} clés)`)

      for (const k of keys.slice(0, 10)) {
        const preview = k.value.length > 50 ? k.value.substring(0, 50) + '...' : k.value
        console.log(`  ${c.dim}${k.path}${c.reset}`)
        console.log(`    ${c.dim}→ "${preview}"${c.reset}`)
      }

      if (keys.length > 10) {
        console.log(`  ${c.dim}... et ${keys.length - 10} autres${c.reset}`)
      }
      console.log('')
    })
  }
}

/**
 * Génère le code à ajouter pour les clés manquantes
 */
function generateCode(reports: SyncReport[]): void {
  for (const r of reports) {
    if (r.missing.length === 0) continue

    console.log(`\n${c.bold}${c.cyan}// ═══════════════════════════════════════${c.reset}`)
    console.log(`${c.bold}${c.cyan}// CLÉS À AJOUTER DANS ${r.lang}.ts${c.reset}`)
    console.log(`${c.bold}${c.cyan}// ═══════════════════════════════════════${c.reset}\n`)

    // Grouper par section
    const bySection = new Map<string, KeyInfo[]>()
    for (const k of r.missing) {
      const section = k.path.split('.')[0]
      if (!bySection.has(section)) bySection.set(section, [])
      bySection.get(section)!.push(k)
    }

    bySection.forEach((keys, section) => {
      console.log(`// --- ${section} ---`)

      for (const k of keys) {
        const parts = k.path.split('.')
        const keyName = parts[parts.length - 1]
        const indent = '  '.repeat(parts.length - 1)
        const escaped = k.value.replace(/'/g, "\\'").replace(/\n/g, '\\n')

        console.log(`${indent}${keyName}: '${escaped}', // TODO: Traduire`)
      }
      console.log('')
    })
  }
}

/**
 * Sauvegarde le rapport en Markdown
 */
function saveReport(reports: SyncReport[]): void {
  const reportPath = path.join(TRANSLATIONS_DIR, 'SYNC_REPORT.md')

  let md = `# 📊 Rapport de synchronisation i18n\n\n`
  md += `> Généré le ${new Date().toLocaleString('fr-FR')}\n\n`
  md += `## Résumé\n\n`
  md += `| Langue | Couverture | Manquantes | En trop |\n`
  md += `|--------|------------|------------|--------|\n`

  for (const r of reports) {
    const icon = r.coverage >= 95 ? '✅' : r.coverage >= 80 ? '⚠️' : '❌'
    md += `| ${r.lang.toUpperCase()} ${icon} | ${r.coverage.toFixed(1)}% | ${r.missing.length} | ${r.extra.length} |\n`
  }

  md += `\n## Clés manquantes par langue\n\n`

  for (const r of reports) {
    if (r.missing.length === 0) {
      md += `### ${r.lang.toUpperCase()} ✅\n\nAucune clé manquante.\n\n`
      continue
    }

    md += `### ${r.lang.toUpperCase()} (${r.missing.length} clés)\n\n`

    // Grouper par section
    const bySection = new Map<string, KeyInfo[]>()
    for (const k of r.missing) {
      const section = k.path.split('.')[0]
      if (!bySection.has(section)) bySection.set(section, [])
      bySection.get(section)!.push(k)
    }

    md += `<details>\n<summary>Voir les clés manquantes</summary>\n\n`

    bySection.forEach((keys, section) => {
      md += `#### ${section} (${keys.length})\n\n`
      md += `\`\`\`typescript\n`

      for (const k of keys) {
        const parts = k.path.split('.')
        const keyName = parts[parts.length - 1]
        const escaped = k.value.replace(/'/g, "\\'").replace(/\n/g, '\\n')
        md += `${keyName}: '${escaped}',\n`
      }

      md += `\`\`\`\n\n`
    })

    md += `</details>\n\n`
  }

  fs.writeFileSync(reportPath, md)
  console.log(`${c.green}✓ Rapport sauvegardé: ${reportPath}${c.reset}`)
}

// ============================================
// MAIN
// ============================================

async function main() {
  const command = process.argv[2] || 'check'

  // Charger la référence
  const refPath = path.join(TRANSLATIONS_DIR, `${REFERENCE_LANG}.ts`)
  if (!fs.existsSync(refPath)) {
    console.error(`${c.red}Fichier de référence non trouvé: ${refPath}${c.reset}`)
    process.exit(1)
  }

  console.log(`${c.cyan}🔍 Analyse des traductions...${c.reset}\n`)

  const refKeys = extractKeysFromFile(refPath)
  console.log(`${c.blue}Référence (${REFERENCE_LANG}):${c.reset} ${refKeys.size} clés\n`)

  // Analyser chaque langue cible
  const reports: SyncReport[] = []

  for (const lang of TARGET_LANGS) {
    const targetPath = path.join(TRANSLATIONS_DIR, `${lang}.ts`)
    if (!fs.existsSync(targetPath)) {
      console.warn(`${c.yellow}⚠️ Fichier non trouvé: ${targetPath}${c.reset}`)
      continue
    }

    const targetKeys = extractKeysFromFile(targetPath)
    console.log(`${c.blue}${lang.toUpperCase()}:${c.reset} ${targetKeys.size} clés`)

    const report = compareKeys(refKeys, targetKeys, lang)
    reports.push(report)
  }

  // Exécuter la commande
  switch (command) {
    case 'check':
      printSummary(reports)
      const hasIssues = reports.some(r => r.missing.length > 0)
      if (hasIssues) {
        console.log(`${c.yellow}💡 Utilisez "pnpm run i18n:sync" pour voir les clés à ajouter${c.reset}`)
        process.exit(1)
      }
      break

    case 'sync':
      printSummary(reports)
      generateCode(reports)
      break

    case 'report':
      printSummary(reports)
      printMissingKeys(reports)
      saveReport(reports)
      break

    default:
      console.log(`
${c.cyan}Script de synchronisation i18n${c.reset}

Commandes:
  ${c.green}pnpm run i18n:check${c.reset}   Vérifie les différences
  ${c.green}pnpm run i18n:sync${c.reset}    Affiche le code des clés manquantes
  ${c.green}pnpm run i18n:report${c.reset}  Génère un rapport Markdown
`)
  }
}

main().catch(console.error)

#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les erreurs 'unknown' en utilisant le helper getErrorMessage
 * Solution propre et robuste pour éviter les erreurs TS18046
 */

const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')

// Patterns à rechercher et remplacer
const patterns = [
  {
    // error.message direct
    search: /(\s+)(error|err|e)\.message/g,
    replace: (_match, indent, varName) => `${indent}getErrorMessage(${varName})`,
    needsImport: true,
  },
  {
    // Dans les template strings
    search: /\$\{(error|err|e)\.message\}/g,
    replace: (_match, varName) => `\${getErrorMessage(${varName})}`,
    needsImport: true,
  },
  {
    // Dans les objets
    search: /:\s*(error|err|e)\.message([,\s}])/g,
    replace: (_match, varName, suffix) => `: getErrorMessage(${varName})${suffix}`,
    needsImport: true,
  },
  {
    // String(error)
    search: /String\((error|err|e)\)/g,
    replace: (_match, varName) => `getErrorMessage(${varName})`,
    needsImport: true,
  },
]

// Fichiers à traiter (basés sur notre analyse)
const filesToProcess = [
  'src/features/marketplace/**/*.ts',
  'src/features/admin/**/*.ts',
  'src/features/notifications/**/*.ts',
  'src/features/pricing/**/*.ts',
  'src/domains/notifications/**/*.ts',
]

let _filesFixed = 0
let _totalReplacements = 0

// Helper pour déterminer le chemin d'import relatif
function getRelativeImportPath(fromFile, toFile = 'src/core/common/utils') {
  const fromDir = path.dirname(fromFile)
  const fromParts = fromDir.split(path.sep)
  const toParts = toFile.split('/')

  // Trouver le point commun
  let commonIndex = 0
  while (
    commonIndex < fromParts.length &&
    commonIndex < toParts.length &&
    fromParts[commonIndex] === toParts[commonIndex]
  ) {
    commonIndex++
  }

  // Construire le chemin relatif
  const upCount = fromParts.length - commonIndex
  const ups = Array(upCount).fill('..').join('/')
  const down = toParts.slice(commonIndex).join('/')

  return ups ? (down ? `${ups}/${down}` : ups) : `./${down}`
}

// Traiter chaque pattern de fichiers
filesToProcess.forEach((pattern) => {
  const files = glob.sync(pattern, { cwd: __dirname })

  files.forEach((file) => {
    const filePath = path.join(__dirname, file)

    // Ignorer les fichiers de test et les fichiers déjà corrigés
    if (
      file.includes('.spec.') ||
      file.includes('.test.') ||
      file.includes('error-handler.utils')
    ) {
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    const originalContent = content
    let needsImport = false
    let replacements = 0

    // Appliquer chaque pattern de remplacement
    patterns.forEach((pattern) => {
      const matches = content.match(pattern.search)
      if (matches) {
        content = content.replace(pattern.search, pattern.replace)
        needsImport = needsImport || pattern.needsImport
        replacements += matches.length
      }
    })

    // Si des remplacements ont été faits et qu'on a besoin d'importer
    if (needsImport && !content.includes('getErrorMessage')) {
      // Calculer le chemin d'import relatif
      const importPath = getRelativeImportPath(file)

      // Ajouter l'import après les autres imports
      const lastImportMatch = content.match(/^import.*from.*$/gm)
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1]
        const insertIndex = content.indexOf(lastImport) + lastImport.length
        content =
          content.slice(0, insertIndex) +
          `\nimport { getErrorMessage } from '${importPath}'` +
          content.slice(insertIndex)
      } else {
        // Ajouter au début du fichier si pas d'imports
        content = `import { getErrorMessage } from '${importPath}'\n\n${content}`
      }
    }

    // Écrire le fichier si modifié
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8')
      _filesFixed++
      _totalReplacements += replacements
    }
  })
})
const { execSync } = require('node:child_process')
try {
  const _result = execSync('npx tsc --noEmit 2>&1 | grep "TS18046" | wc -l', { encoding: 'utf8' })
} catch (_e) {}

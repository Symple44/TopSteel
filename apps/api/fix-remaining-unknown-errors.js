#!/usr/bin/env node

/**
 * Script amélioré pour corriger TOUTES les erreurs TS18046 restantes
 * Utilise les helpers existants : getErrorMessage, hasStack, isError
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')
const tsErrors = execSync('npx tsc --noEmit 2>&1 | grep "TS18046"', { encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.includes('TS18046'))

// Parser les erreurs pour extraire fichier, ligne et variable
const errorDetails = tsErrors
  .map((error) => {
    const match = error.match(/^(.+?)\((\d+),(\d+)\): error TS18046: '(.+?)' is of type 'unknown'/)
    if (!match) return null

    return {
      file: match[1],
      line: parseInt(match[2], 10),
      column: parseInt(match[3], 10),
      variable: match[4],
    }
  })
  .filter(Boolean)

// Grouper par fichier
const errorsByFile = {}
errorDetails.forEach((error) => {
  if (!errorsByFile[error.file]) {
    errorsByFile[error.file] = []
  }
  errorsByFile[error.file].push(error)
})

let _totalFixed = 0

// Traiter chaque fichier
Object.entries(errorsByFile).forEach(([file, errors]) => {
  const filePath = path.join(__dirname, file)
  let content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split('\n')

  // Vérifier si les imports nécessaires sont présents
  const _hasGetErrorMessage = content.includes('getErrorMessage')
  const _hasHasStack = content.includes('hasStack')
  const _hasIsError = content.includes('isError')

  const needsImports = {
    getErrorMessage: false,
    hasStack: false,
    isError: false,
    toError: false,
  }

  // Traiter chaque erreur (en ordre inverse pour ne pas décaler les lignes)
  errors
    .sort((a, b) => b.line - a.line)
    .forEach((error) => {
      const lineIndex = error.line - 1
      const line = lines[lineIndex]

      if (!line) return

      // Patterns de correction
      if (line.includes(`${error.variable}.stack`)) {
        // Pattern: error.stack
        lines[lineIndex] = line.replace(
          `${error.variable}.stack`,
          `hasStack(${error.variable}) ? ${error.variable}.stack : undefined`
        )
        needsImports.hasStack = true
        _totalFixed++
      } else if (line.includes(`${error.variable}.message`) && !line.includes('getErrorMessage')) {
        // Pattern: error.message (non déjà corrigé)
        lines[lineIndex] = line.replace(
          `${error.variable}.message`,
          `getErrorMessage(${error.variable})`
        )
        needsImports.getErrorMessage = true
        _totalFixed++
      } else if (line.includes(`${error.variable}.code`)) {
        // Pattern: error.code
        lines[lineIndex] = line.replace(
          `${error.variable}.code`,
          `(isError(${error.variable}) && 'code' in ${error.variable} ? (${error.variable} as any).code : undefined)`
        )
        needsImports.isError = true
        _totalFixed++
      } else if (line.includes(`String(${error.variable})`)) {
        // Pattern: String(error)
        lines[lineIndex] = line.replace(
          `String(${error.variable})`,
          `getErrorMessage(${error.variable})`
        )
        needsImports.getErrorMessage = true
        _totalFixed++
      } else if (line.includes(`JSON.stringify(${error.variable})`)) {
        // Pattern: JSON.stringify(error)
        lines[lineIndex] = line.replace(
          `JSON.stringify(${error.variable})`,
          `JSON.stringify(toError(${error.variable}))`
        )
        needsImports.toError = true
        _totalFixed++
      } else if (line.includes(`throw ${error.variable}`) && error.variable !== 'error') {
        // Pattern: throw e (où e n'est pas déjà Error)
        lines[lineIndex] = line.replace(
          `throw ${error.variable}`,
          `throw toError(${error.variable})`
        )
        needsImports.toError = true
        _totalFixed++
      } else if (line.includes(`${error.variable} instanceof`)) {
      } else {
        // Essayer de remplacer l'accès direct par une conversion safe
        const pattern = new RegExp(`(\\s|\\(|\\{|,)${error.variable}(\\.\\w+)`, 'g')
        if (pattern.test(line)) {
          lines[lineIndex] = line.replace(pattern, `$1toError(${error.variable})$2`)
          needsImports.toError = true
          _totalFixed++
        }
      }
    })

  // Reconstruire le contenu
  content = lines.join('\n')

  // Ajouter les imports nécessaires
  const importsNeeded = Object.entries(needsImports)
    .filter(([_, needed]) => needed)
    .map(([name]) => name)

  if (importsNeeded.length > 0) {
    // Calculer le chemin relatif vers utils
    const relativePath = path
      .relative(path.dirname(filePath), path.join(__dirname, 'src/core/common/utils'))
      .replace(/\\/g, '/')

    const importStatement = `import { ${importsNeeded.join(', ')} } from '${relativePath}'`

    // Vérifier si l'import existe déjà
    if (!content.includes(importStatement)) {
      // Trouver où insérer l'import (après les autres imports)
      const importRegex = /^import.*from.*$/gm
      const imports = content.match(importRegex)

      if (imports) {
        const lastImport = imports[imports.length - 1]
        const insertIndex = content.indexOf(lastImport) + lastImport.length
        content = `${content.slice(0, insertIndex)}\n${importStatement}${content.slice(insertIndex)}`
      } else {
        // Ajouter au début si aucun import
        content = `${importStatement}\n\n${content}`
      }
    }
  }

  // Écrire le fichier
  fs.writeFileSync(filePath, content, 'utf8')
})
try {
  const _remaining = execSync('npx tsc --noEmit 2>&1 | grep "TS18046" | wc -l', {
    encoding: 'utf8',
  })
} catch (_e) {}

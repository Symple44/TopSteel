#!/usr/bin/env node

/**
 * Script pour corriger les imports manquants de getErrorMessage et autres helpers
 * Corrige les erreurs TS2304: Cannot find name 'xxx'
 */

const fs = require('node:fs')
const path = require('node:path')
const { execSync } = require('node:child_process')

// Obtenir toutes les erreurs TS2304
const errors = execSync('npx tsc --noEmit 2>&1 | grep "TS2304"', { encoding: 'utf8' })
  .split('\n')
  .filter((line) => line.includes('TS2304'))

// Parser les erreurs pour extraire fichier et nom manquant
const missingByFile = {}
errors.forEach((error) => {
  const match = error.match(/^(.+?)\(\d+,\d+\): error TS2304: Cannot find name '(.+?)'/)
  if (!match) return

  const [, file, name] = match
  if (!missingByFile[file]) {
    missingByFile[file] = new Set()
  }
  missingByFile[file].add(name)
})

// Helpers disponibles dans error.utils.ts
const availableHelpers = ['getErrorMessage', 'toError', 'isError', 'hasStack']

let _filesFixed = 0

Object.entries(missingByFile).forEach(([file, missingNames]) => {
  const filePath = path.join(__dirname, file)

  // Filtrer seulement les helpers qu'on peut importer
  const helpersToImport = Array.from(missingNames).filter((name) => availableHelpers.includes(name))

  if (helpersToImport.length === 0) return

  let content = fs.readFileSync(filePath, 'utf8')

  // Vérifier si l'import existe déjà
  const hasImport = helpersToImport.every(
    (helper) => content.includes(`import`) && content.includes(helper) && content.includes('utils')
  )

  if (hasImport) {
  } else {
    // Calculer le chemin relatif vers utils
    const fileDir = path.dirname(filePath)
    const utilsPath = path.join(__dirname, 'src/core/common/utils')
    const relativePath = path.relative(fileDir, utilsPath).replace(/\\/g, '/')

    // Créer l'import statement
    const importStatement = `import { ${helpersToImport.join(', ')} } from '${relativePath}'`

    // Trouver où insérer l'import
    const importRegex = /^import.*from.*$/gm
    const imports = content.match(importRegex)

    if (imports && imports.length > 0) {
      // Trouver le dernier import
      const lastImport = imports[imports.length - 1]
      const insertIndex = content.indexOf(lastImport) + lastImport.length

      // Vérifier qu'on n'a pas déjà cet import
      if (!content.includes(importStatement)) {
        content = `${content.slice(0, insertIndex)}\n${importStatement}${content.slice(insertIndex)}`
      }
    } else {
      // Pas d'imports, ajouter au début
      content = `${importStatement}\n\n${content}`
    }

    // Écrire le fichier
    fs.writeFileSync(filePath, content, 'utf8')
    _filesFixed++
  }
})
try {
  const remaining = execSync('npx tsc --noEmit 2>&1 | grep "TS2304" | wc -l', { encoding: 'utf8' })
  const count = parseInt(remaining.trim(), 10)
  if (count > 0) {
    // Montrer quels noms sont encore manquants
    const remainingErrors = execSync('npx tsc --noEmit 2>&1 | grep "TS2304"', { encoding: 'utf8' })
      .split('\n')
      .filter((line) => line.includes('TS2304'))
      .slice(0, 5)
    remainingErrors.forEach((err) => {
      const match = err.match(/Cannot find name '(.+?)'/)
      if (match) {
      }
    })
  } else {
  }
} catch (_e) {}

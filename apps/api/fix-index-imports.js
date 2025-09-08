#!/usr/bin/env node

/**
 * Script pour corriger automatiquement les imports Index manquants dans les entités TypeORM
 * Solution propre et robuste pour éviter les erreurs TS2304
 */

const fs = require('node:fs')
const path = require('node:path')
const glob = require('glob')

// Trouver tous les fichiers *.entity.ts
const entityFiles = glob.sync('src/**/*.entity.ts', { cwd: __dirname })

let _filesFixed = 0
let _alreadyCorrect = 0

entityFiles.forEach((file) => {
  const filePath = path.join(__dirname, file)
  let content = fs.readFileSync(filePath, 'utf8')

  // Vérifier si le fichier utilise @Index
  if (!content.includes('@Index')) {
    return // Pas besoin de correction
  }

  // Vérifier si Index est déjà importé
  if (
    content.includes('import') &&
    content.includes('Index') &&
    content.includes("from 'typeorm'")
  ) {
    _alreadyCorrect++
    return
  }

  // Pattern pour trouver l'import TypeORM existant
  const typeormImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]typeorm['"]/
  const match = content.match(typeormImportRegex)

  if (match) {
    // Extraire les imports existants
    const existingImports = match[1]
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s)

    // Ajouter Index s'il n'est pas déjà présent
    if (!existingImports.includes('Index')) {
      existingImports.push('Index')

      // Trier les imports alphabétiquement pour être propre
      existingImports.sort()

      // Reconstruire l'import avec formatage propre
      const newImport = `import {\n  ${existingImports.join(',\n  ')},\n} from 'typeorm'`

      // Remplacer l'ancien import
      content = content.replace(typeormImportRegex, newImport)

      // Écrire le fichier corrigé
      fs.writeFileSync(filePath, content, 'utf8')
      _filesFixed++
    }
  } else {
  }
})

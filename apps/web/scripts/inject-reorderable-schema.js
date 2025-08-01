#!/usr/bin/env node

/**
 * Script pour injecter le schéma de base de données pour les préférences ReorderableList
 */

const fs = require('node:fs')
const path = require('node:path')

async function injectSchema() {
  try {
    // Lire le fichier SQL
    const schemaPath = path.join(__dirname, '../src/components/ui/reorderable-list/schema.sql')
    const sqlContent = fs.readFileSync(schemaPath, 'utf8')

    // Optionnel: sauvegarder dans un fichier SQL consolidé
    const outputPath = path.join(__dirname, '../create_reorderable_preferences_tables.sql')
    fs.writeFileSync(outputPath, sqlContent)
  } catch (_error) {
    process.exit(1)
  }
}

// Exécution si appelé directement
if (require.main === module) {
  injectSchema()
}

module.exports = { injectSchema }

#!/usr/bin/env node

/**
 * Script de vérification de la configuration Turbo
 * Vérifie que la concurrence est correctement configurée
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

try {
  const turboConfigPath = path.join(__dirname, '..', 'turbo.json')
  const turboConfig = JSON.parse(fs.readFileSync(turboConfigPath, 'utf8'))

  console.log('🔧 Configuration Turbo:')
  console.log(`   - Concurrence: ${turboConfig.concurrency || 'par défaut (10)'}`)
  console.log(`   - UI: ${turboConfig.ui || 'stream'}`)

  // Compter les tâches persistantes
  const persistentTasks = Object.entries(turboConfig.tasks || {})
    .filter(([_, config]) => config.persistent)
    .map(([name]) => name)

  console.log(`   - Tâches persistantes: ${persistentTasks.length}`)
  console.log(`     ${persistentTasks.join(', ')}`)

  const concurrency = parseInt(turboConfig.concurrency || '10')
  if (persistentTasks.length >= concurrency) {
    console.log('⚠️  ATTENTION: Nombre de tâches persistantes >= concurrence')
    console.log(`   Recommandé: augmenter la concurrence à ${persistentTasks.length + 1}`)
  } else {
    console.log('✅ Configuration OK')
  }
} catch (error) {
  console.error('❌ Erreur lors de la lecture de turbo.json:', error.message)
  process.exit(1)
}

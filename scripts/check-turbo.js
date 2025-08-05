#!/usr/bin/env node

/**
 * Script de vérification de la configuration Turbo
 * Vérifie que la concurrence est correctement configurée
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

try {
  const turboConfigPath = path.join(__dirname, '..', 'turbo.json')
  const turboConfig = JSON.parse(fs.readFileSync(turboConfigPath, 'utf8'))

  // Compter les tâches persistantes
  const persistentTasks = Object.entries(turboConfig.tasks || {})
    .filter(([_, config]) => config.persistent)
    .map(([name]) => name)

  const concurrency = parseInt(turboConfig.concurrency || '10')
  if (persistentTasks.length >= concurrency) {
  } else {
  }
} catch (_error) {
  process.exit(1)
}

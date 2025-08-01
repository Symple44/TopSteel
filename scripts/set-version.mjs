#!/usr/bin/env node

/**
 * Script pour définir automatiquement la version de l'application
 * Usage: node scripts/set-version.mjs [version]
 *
 * Si aucune version n'est spécifiée, utilise la version du package.json racine
 * Génère également la date de build et le hash du commit git (si disponible)
 */

import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Equivalent de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function getCurrentGitHash() {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
  } catch (_error) {
    return 'unknown'
  }
}

function getCurrentVersion() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return packageJson.version || '1.0.0'
    }
  } catch (_error) {}
  return '1.0.0'
}

function updateEnvFile(envPath, version, buildDate, commitHash) {
  let envContent = ''

  // Lire le fichier existant s'il existe
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Mettre à jour ou ajouter les variables de version dans la section APPLICATION
  const updates = {
    APP_VERSION: version,
    APP_BUILD_DATE: buildDate,
    APP_COMMIT_HASH: commitHash,
  }

  for (const [key, value] of Object.entries(updates)) {
    const regex = new RegExp(`^${key}=.*$`, 'm')
    if (envContent.match(regex)) {
      envContent = envContent.replace(regex, `${key}=${value}`)
    } else {
      // Ajouter dans la section APPLICATION si elle existe
      const applicationSectionRegex = /^# ===== APPLICATION =====/m
      if (envContent.match(applicationSectionRegex)) {
        // Trouver la fin de la section APPLICATION
        const nextSectionRegex = /^(# ===== [^=]+ =====)$/gm
        const matches = [...envContent.matchAll(nextSectionRegex)]
        let _insertPos = envContent.length

        for (let i = 0; i < matches.length; i++) {
          const match = matches[i]
          if (match[0].includes('APPLICATION')) {
            // Trouver la section suivante
            if (matches[i + 1]) {
              _insertPos = match.index + match[0].length
              // Chercher où insérer avant la prochaine section
              const nextSectionStart = matches[i + 1].index
              // Insérer avant la prochaine section
              envContent =
                envContent.slice(0, nextSectionStart) +
                `${key}=${value}\n\n` +
                envContent.slice(nextSectionStart)
              break
            }
          }
        }
      } else {
        // Ajouter à la fin s'il n'y a pas de section APPLICATION
        if (envContent && !envContent.endsWith('\n')) {
          envContent += '\n'
        }
        envContent += `${key}=${value}\n`
      }
    }
  }

  fs.writeFileSync(envPath, envContent, 'utf8')
}

function main() {
  const version = process.argv[2] || getCurrentVersion()
  const buildDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const commitHash = getCurrentGitHash()

  // Mettre à jour les fichiers .env racine centralisés
  const envFiles = ['.env', '.env.local']

  for (const envFile of envFiles) {
    const envPath = path.join(process.cwd(), envFile)

    if (fs.existsSync(envPath)) {
      updateEnvFile(envPath, version, buildDate, commitHash)
    } else if (envFile === '.env') {
      updateEnvFile(envPath, version, buildDate, commitHash)
    } else {
    }
  }

  // Créer un fichier de version JSON pour le frontend
  const versionInfo = {
    version,
    buildDate,
    commitHash,
    buildTime: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  }

  const frontendPublicPath = path.join(process.cwd(), 'apps/web/public/version.json')
  const frontendPublicDir = path.dirname(frontendPublicPath)

  if (fs.existsSync(frontendPublicDir)) {
    fs.writeFileSync(frontendPublicPath, JSON.stringify(versionInfo, null, 2), 'utf8')
  } else {
  }
}

// Exécuter le script si appelé directement
main()

#!/usr/bin/env node
const crypto = require('node:crypto')
const fs = require('node:fs')
const path = require('node:path')

/**
 * Génère un JWT_SECRET sécurisé pour l'environnement de développement
 */
function generateSecureJWTSecret() {
  // Génère une clé aléatoire de 64 bytes (512 bits)
  const secret = crypto.randomBytes(64).toString('base64')
  return secret
}

/**
 * Met à jour ou crée le fichier .env.local avec le nouveau secret
 */
function updateEnvFile(envPath, secret) {
  let envContent = ''

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }

  // Check if JWT_SECRET already exists
  const jwtSecretRegex = /^JWT_SECRET=.*$/m

  if (jwtSecretRegex.test(envContent)) {
    // Replace existing JWT_SECRET
    envContent = envContent.replace(jwtSecretRegex, `JWT_SECRET="${secret}"`)
  } else {
    // Add JWT_SECRET
    if (envContent && !envContent.endsWith('\n')) {
      envContent += '\n'
    }
    envContent += `# Generated secure JWT secret - DO NOT COMMIT\n`
    envContent += `JWT_SECRET="${secret}"\n`
  }

  fs.writeFileSync(envPath, envContent)
}

/**
 * Main function
 */
function main() {
  const secret = generateSecureJWTSecret()

  // Update .env files in all apps
  const appsDir = path.join(__dirname, '..', 'apps')
  const apps = ['api', 'web', 'marketplace-api']

  apps.forEach((app) => {
    const appPath = path.join(appsDir, app)
    if (fs.existsSync(appPath)) {
      // Check for .env.local first (preferred for local dev)
      const envLocalPath = path.join(appPath, '.env.local')
      const envPath = path.join(appPath, '.env')

      if (fs.existsSync(envLocalPath) || !fs.existsSync(envPath)) {
        updateEnvFile(envLocalPath, secret)
      } else {
        updateEnvFile(envPath, secret)
      }
    }
  })
}

// Run if called directly
if (require.main === module) {
  main()
}

module.exports = { generateSecureJWTSecret }

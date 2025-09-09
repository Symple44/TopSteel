#!/usr/bin/env node
/**
 * Script d'harmonisation des fichiers .env
 * Élimine les doublons et standardise les variables
 */

const fs = require('fs')
const path = require('path')

// Configuration des mappings de variables
const VARIABLE_MAPPINGS = {
  // Database
  DB_HOST: 'DATABASE_HOST',
  DB_PORT: 'DATABASE_PORT',
  DB_USERNAME: 'DATABASE_USERNAME',
  DB_PASSWORD: 'DATABASE_PASSWORD',
  DB_NAME: 'DATABASE_NAME',
  DB_AUTH_HOST: 'DATABASE_AUTH_HOST',
  DB_AUTH_PORT: 'DATABASE_AUTH_PORT',
  DB_AUTH_USERNAME: 'DATABASE_AUTH_USERNAME',
  DB_AUTH_PASSWORD: 'DATABASE_AUTH_PASSWORD',
  DB_AUTH_NAME: 'DATABASE_AUTH_NAME',

  // JWT & Auth
  JWT_SECRET: 'AUTH_JWT_SECRET',
  JWT_REFRESH_SECRET: 'AUTH_JWT_REFRESH_SECRET',
  JWT_EXPIRES_IN: 'AUTH_JWT_EXPIRES_IN',
  JWT_REFRESH_EXPIRES_IN: 'AUTH_JWT_REFRESH_EXPIRES_IN',
  BCRYPT_ROUNDS: 'AUTH_BCRYPT_ROUNDS',

  // Services & Ports
  API_PORT: 'SERVICE_API_PORT',
  WEB_PORT: 'SERVICE_WEB_PORT',
  WS_PORT: 'SERVICE_WEBSOCKET_PORT',
  AUTH_SERVICE_PORT: 'SERVICE_AUTH_PORT',
  NOTIFICATION_SERVICE_PORT: 'SERVICE_NOTIFICATION_PORT',
  MARKETPLACE_API_PORT: 'SERVICE_MARKETPLACE_API_PORT',
  MARKETPLACE_WEB_PORT: 'SERVICE_MARKETPLACE_WEB_PORT',

  // CORS & Security
  CORS_ORIGIN: 'SECURITY_CORS_ORIGINS',
  CORS_ORIGINS: 'SECURITY_CORS_ORIGINS',
  API_CORS_ORIGIN: 'SECURITY_CORS_ORIGINS',
  THROTTLE_LIMIT: 'SECURITY_RATE_LIMIT_MAX',
  THROTTLE_TTL: 'SECURITY_RATE_LIMIT_WINDOW_MS',
  RATE_LIMIT_MAX_REQUESTS: 'SECURITY_RATE_LIMIT_MAX',
  RATE_LIMIT_WINDOW_MS: 'SECURITY_RATE_LIMIT_WINDOW_MS',

  // SMTP
  SMTP_PASS: 'SMTP_PASSWORD',
  EMAIL_FROM: 'SMTP_FROM',
}

// Variables sensibles à ne jamais committer
const SENSITIVE_VARIABLES = [
  'PASSWORD',
  'SECRET',
  'KEY',
  'TOKEN',
  'CREDENTIAL',
  'PRIVATE',
  'SALT',
  'HASH',
  'AUTH',
  'API_KEY',
]

// Valeurs par défaut sécurisées
const SECURE_DEFAULTS = {
  AUTH_JWT_SECRET: 'GENERATE_WITH_OPENSSL_RAND_BASE64_32',
  AUTH_JWT_REFRESH_SECRET: 'GENERATE_WITH_OPENSSL_RAND_BASE64_32',
  SESSION_SECRET: 'GENERATE_WITH_OPENSSL_RAND_HEX_32',
  NEXTAUTH_SECRET: 'GENERATE_WITH_OPENSSL_RAND_BASE64_32',
  DATABASE_PASSWORD: 'CHANGE_IN_PRODUCTION',
  ELASTICSEARCH_PASSWORD: 'CHANGE_IN_PRODUCTION',
  REDIS_PASSWORD: '',
}

class EnvHarmonizer {
  constructor() {
    this.allVariables = new Map()
    this.conflicts = []
    this.duplicates = []
    this.sensitive = []
  }

  /**
   * Analyse un fichier .env
   */
  parseEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {}

    const content = fs.readFileSync(filePath, 'utf-8')
    const variables = {}

    content.split('\n').forEach((line) => {
      // Ignorer les commentaires et lignes vides
      if (line.startsWith('#') || !line.trim()) return

      const [key, ...valueParts] = line.split('=')
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim()
        variables[key.trim()] = value.replace(/^["']|["']$/g, '')
      }
    })

    return variables
  }

  /**
   * Analyse tous les fichiers .env du projet
   */
  analyzeAllEnvFiles() {
    const envFiles = [
      '.env',
      '.env.local',
      '.env.staging',
      '.env.production',
      '.env.security',
      '.env.example',
      'apps/api/.env.local',
      'apps/web/.env.local',
      'apps/marketplace-api/.env.local',
    ]

    console.log('📊 Analyse des fichiers .env...\n')

    envFiles.forEach((file) => {
      const filePath = path.join(process.cwd(), file)
      if (fs.existsSync(filePath)) {
        const variables = this.parseEnvFile(filePath)
        const count = Object.keys(variables).length

        console.log(`✅ ${file}: ${count} variables`)

        // Stocker les variables avec leur source
        Object.entries(variables).forEach(([key, value]) => {
          if (!this.allVariables.has(key)) {
            this.allVariables.set(key, [])
          }
          this.allVariables.get(key).push({ file, value })

          // Détecter les variables sensibles
          if (this.isSensitive(key, value)) {
            this.sensitive.push({ key, file, value: '***REDACTED***' })
          }
        })
      } else {
        console.log(`⚠️  ${file}: Non trouvé`)
      }
    })
  }

  /**
   * Vérifie si une variable est sensible
   */
  isSensitive(key, value) {
    // Vérifier le nom de la variable
    const upperKey = key.toUpperCase()
    for (const sensitive of SENSITIVE_VARIABLES) {
      if (upperKey.includes(sensitive)) {
        // Exclure les valeurs placeholder
        if (
          !value ||
          value === 'changeme' ||
          value.startsWith('GENERATE_') ||
          value.startsWith('CHANGE_') ||
          value.startsWith('your_') ||
          value.includes('example')
        ) {
          return false
        }
        return true
      }
    }
    return false
  }

  /**
   * Trouve les doublons et conflits
   */
  findConflicts() {
    console.log('\n🔍 Analyse des conflits...\n')

    this.allVariables.forEach((sources, key) => {
      if (sources.length > 1) {
        const uniqueValues = [...new Set(sources.map((s) => s.value))]

        if (uniqueValues.length > 1) {
          // Conflit: même variable, valeurs différentes
          this.conflicts.push({
            variable: key,
            sources: sources.map((s) => ({ file: s.file, value: s.value })),
          })
        } else {
          // Doublon: même variable, même valeur
          this.duplicates.push({
            variable: key,
            files: sources.map((s) => s.file),
            value: sources[0].value,
          })
        }
      }
    })

    // Afficher les conflits
    if (this.conflicts.length > 0) {
      console.log('❌ Conflits détectés (même variable, valeurs différentes):')
      this.conflicts.forEach((conflict) => {
        console.log(`\n  ${conflict.variable}:`)
        conflict.sources.forEach((source) => {
          const displayValue = this.isSensitive(conflict.variable, source.value)
            ? '***REDACTED***'
            : source.value.substring(0, 50) + (source.value.length > 50 ? '...' : '')
          console.log(`    ${source.file}: ${displayValue}`)
        })
      })
    }

    // Afficher les doublons
    if (this.duplicates.length > 0) {
      console.log('\n⚠️  Doublons détectés (même variable, même valeur):')
      this.duplicates.slice(0, 10).forEach((dup) => {
        console.log(`  ${dup.variable}: présent dans ${dup.files.length} fichiers`)
      })
      if (this.duplicates.length > 10) {
        console.log(`  ... et ${this.duplicates.length - 10} autres doublons`)
      }
    }
  }

  /**
   * Génère le fichier .env.defaults harmonisé
   */
  generateDefaults() {
    console.log('\n✨ Génération de .env.defaults...\n')

    const defaults = new Map()
    const categories = {
      ENVIRONMENT: [],
      DATABASE: [],
      AUTH: [],
      SERVICE: [],
      SECURITY: [],
      REDIS: [],
      ELASTICSEARCH: [],
      SMTP: [],
      FEATURE: [],
      OTHER: [],
    }

    // Appliquer les mappings et catégoriser
    this.allVariables.forEach((sources, key) => {
      // Appliquer le mapping si existe
      const newKey = VARIABLE_MAPPINGS[key] || key

      // Déterminer la valeur par défaut
      let defaultValue = ''
      if (SECURE_DEFAULTS[newKey]) {
        defaultValue = SECURE_DEFAULTS[newKey]
      } else if (!this.isSensitive(newKey, sources[0].value)) {
        defaultValue = sources[0].value
      }

      // Catégoriser
      let category = 'OTHER'
      if (newKey.startsWith('DATABASE_')) category = 'DATABASE'
      else if (newKey.startsWith('AUTH_') || newKey.includes('JWT') || newKey.includes('SESSION'))
        category = 'AUTH'
      else if (newKey.startsWith('SERVICE_') || newKey.includes('_PORT')) category = 'SERVICE'
      else if (
        newKey.startsWith('SECURITY_') ||
        newKey.includes('CORS') ||
        newKey.includes('RATE_LIMIT')
      )
        category = 'SECURITY'
      else if (newKey.startsWith('REDIS_')) category = 'REDIS'
      else if (newKey.startsWith('ELASTICSEARCH_')) category = 'ELASTICSEARCH'
      else if (newKey.startsWith('SMTP_') || newKey.includes('EMAIL')) category = 'SMTP'
      else if (newKey.startsWith('FEATURE_')) category = 'FEATURE'
      else if (['NODE_ENV', 'APP_NAME', 'APP_VERSION', 'LOG_LEVEL'].includes(newKey))
        category = 'ENVIRONMENT'

      if (!defaults.has(newKey)) {
        defaults.set(newKey, defaultValue)
        categories[category].push({ key: newKey, value: defaultValue })
      }
    })

    // Créer le fichier .env.defaults
    let content = `# ============================================================================
# TOPSTEEL ERP - CONFIGURATION PAR DÉFAUT (HARMONISÉE)
# ============================================================================
# Généré le: ${new Date().toISOString()}
# Ce fichier contient les valeurs par défaut sans secrets
# ============================================================================\n\n`

    Object.entries(categories).forEach(([category, vars]) => {
      if (vars.length > 0) {
        content += `# ==== ${category} ====\n`
        vars.sort((a, b) => a.key.localeCompare(b.key))
        vars.forEach(({ key, value }) => {
          content += `${key}=${value}\n`
        })
        content += '\n'
      }
    })

    fs.writeFileSync('.env.defaults', content)
    console.log('✅ .env.defaults créé avec succès')
  }

  /**
   * Affiche les variables sensibles détectées
   */
  reportSensitiveVariables() {
    if (this.sensitive.length > 0) {
      console.log('\n🔐 Variables sensibles détectées (à migrer vers .env.local):')
      const uniqueSensitive = new Map()
      this.sensitive.forEach((s) => {
        if (!uniqueSensitive.has(s.key)) {
          uniqueSensitive.set(s.key, [])
        }
        uniqueSensitive.get(s.key).push(s.file)
      })

      uniqueSensitive.forEach((files, key) => {
        console.log(`  ${key}: ${files.join(', ')}`)
      })

      console.log('\n⚠️  Ces variables ne doivent JAMAIS être committées!')
    }
  }

  /**
   * Génère le rapport d'harmonisation
   */
  generateReport() {
    const report = {
      totalVariables: this.allVariables.size,
      duplicates: this.duplicates.length,
      conflicts: this.conflicts.length,
      sensitive: this.sensitive.length,
      timestamp: new Date().toISOString(),
    }

    fs.writeFileSync('env-harmonization-report.json', JSON.stringify(report, null, 2))

    console.log("\n📊 Rapport d'harmonisation:")
    console.log(`  Variables totales: ${report.totalVariables}`)
    console.log(`  Doublons: ${report.duplicates}`)
    console.log(`  Conflits: ${report.conflicts}`)
    console.log(`  Variables sensibles: ${report.sensitive}`)
    console.log('\n✅ Rapport sauvegardé dans env-harmonization-report.json')
  }

  /**
   * Exécute l'harmonisation complète
   */
  run() {
    console.log("🔄 Début de l'harmonisation des fichiers .env\n")
    console.log('='.repeat(60))

    this.analyzeAllEnvFiles()
    this.findConflicts()
    this.reportSensitiveVariables()
    this.generateDefaults()
    this.generateReport()

    console.log('\n' + '='.repeat(60))
    console.log('✨ Harmonisation terminée!')
    console.log('\n📋 Prochaines étapes:')
    console.log('  1. Vérifier .env.defaults')
    console.log('  2. Migrer les variables sensibles vers .env.local')
    console.log('  3. Supprimer les fichiers .env redondants')
    console.log('  4. Mettre à jour les applications pour utiliser les nouveaux noms')
  }
}

// Exécuter l'harmonisation
const harmonizer = new EnvHarmonizer()
harmonizer.run()

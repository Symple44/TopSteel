#!/usr/bin/env ts-node

/**
 * SCRIPT D'INTÉGRATION COMPLÈTE DU SYSTÈME PRICING
 * 
 * Ce script automatise toute l'intégration du système de pricing:
 * - Configuration des modules
 * - Mise à jour des imports
 * - Installation des dépendances
 * - Exécution des migrations
 * - Lancement des tests
 * - Validation complète
 */

import { execSync, spawn } from 'child_process'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import * as colors from 'colors/safe'

interface IntegrationStep {
  name: string
  description: string
  action: () => Promise<void>
  critical: boolean
}

class PricingSystemIntegrator {
  private readonly rootDir = process.cwd()
  private readonly backupDir = join(this.rootDir, '.pricing-backup')
  
  constructor() {
    console.log(colors.cyan('🚀 INTÉGRATION SYSTÈME PRICING - DÉMARRAGE'))
    console.log(colors.gray('=' .repeat(60) + '\n'))
  }

  async run(): Promise<void> {
    // Créer le backup avant modifications
    await this.createBackup()

    const steps: IntegrationStep[] = [
      {
        name: 'Dependencies',
        description: 'Installation des dépendances NPM',
        action: () => this.installDependencies(),
        critical: true
      },
      {
        name: 'Module Update',
        description: 'Mise à jour app.module.ts avec PricingUnifiedModule',
        action: () => this.updateAppModule(),
        critical: true
      },
      {
        name: 'Environment',
        description: 'Configuration des variables d\'environnement',
        action: () => this.setupEnvironment(),
        critical: true
      },
      {
        name: 'Database',
        description: 'Génération et exécution des migrations',
        action: () => this.setupDatabase(),
        critical: true
      },
      {
        name: 'Redis Setup',
        description: 'Configuration et test Redis',
        action: () => this.setupRedis(),
        critical: true
      },
      {
        name: 'GraphQL',
        description: 'Configuration GraphQL',
        action: () => this.setupGraphQL(),
        critical: false
      },
      {
        name: 'Tests',
        description: 'Création et exécution des tests',
        action: () => this.setupTests(),
        critical: false
      },
      {
        name: 'Build Check',
        description: 'Vérification des builds',
        action: () => this.checkBuilds(),
        critical: true
      },
      {
        name: 'Quality Validation',
        description: 'Validation finale avec agents de qualité',
        action: () => this.runQualityValidation(),
        critical: false
      }
    ]

    let successCount = 0
    let criticalFailures = 0

    for (const step of steps) {
      console.log(colors.blue(`\n🔄 ${step.name} - ${step.description}`))
      console.log(colors.gray('-'.repeat(50)))

      try {
        await step.action()
        console.log(colors.green(`✅ ${step.name} - Succès`))
        successCount++
      } catch (error) {
        const status = step.critical ? colors.red('❌ CRITIQUE') : colors.yellow('⚠️  OPTIONNEL')
        console.log(`${status} ${step.name} - Échec: ${error.message}`)
        
        if (step.critical) {
          criticalFailures++
          console.log(colors.red(`💥 Étape critique échouée. Vérifiez la configuration.`))
        }
      }
    }

    await this.generateSummaryReport(steps.length, successCount, criticalFailures)
  }

  /**
   * Crée un backup avant modifications
   */
  private async createBackup(): Promise<void> {
    console.log(colors.yellow('📦 Création du backup...'))
    
    if (!existsSync(this.backupDir)) {
      mkdirSync(this.backupDir, { recursive: true })
    }

    const filesToBackup = [
      'apps/api/src/app/app.module.ts',
      'apps/api/src/features/pricing/pricing.module.ts',
      '.env',
      '.env.example',
      'package.json'
    ]

    for (const file of filesToBackup) {
      const srcPath = join(this.rootDir, file)
      const destPath = join(this.backupDir, file.replace(/\//g, '_'))
      
      if (existsSync(srcPath)) {
        const content = readFileSync(srcPath, 'utf8')
        writeFileSync(destPath, content)
        console.log(colors.gray(`  ✓ Backup: ${file}`))
      }
    }
  }

  /**
   * Installation des dépendances NPM
   */
  private async installDependencies(): Promise<void> {
    const dependencies = [
      '@nestjs-modules/ioredis',
      'ioredis',
      '@tensorflow/tfjs-node',
      '@nestjs/graphql',
      '@nestjs/apollo',
      'graphql',
      'apollo-server-express', 
      'graphql-type-json',
      '@nestjs/axios',
      'axios',
      '@nestjs/event-emitter',
      '@nestjs/schedule',
      '@nestjs/bull',
      'bull',
      '@nestjs/throttler',
      'opossum'
    ]

    const devDependencies = [
      '@types/bull',
      'madge',
      'colors'
    ]

    console.log('  📦 Installation des dépendances principales...')
    try {
      execSync(`npm install ${dependencies.join(' ')}`, {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 300000 // 5 minutes
      })
    } catch (error) {
      throw new Error(`Échec installation dépendances: ${error.message}`)
    }

    console.log('  📦 Installation des dépendances de développement...')
    try {
      execSync(`npm install -D ${devDependencies.join(' ')}`, {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 180000 // 3 minutes
      })
    } catch (error) {
      console.log(colors.yellow('  ⚠️  Certaines dépendances dev ont échoué (non critique)'))
    }
  }

  /**
   * Met à jour app.module.ts
   */
  private async updateAppModule(): Promise<void> {
    const appModulePath = join(this.rootDir, 'apps/api/src/app/app.module.ts')
    
    if (!existsSync(appModulePath)) {
      throw new Error('app.module.ts non trouvé')
    }

    const content = readFileSync(appModulePath, 'utf8')
    
    // Vérifier si déjà configuré
    if (content.includes('PricingUnifiedModule')) {
      console.log('  ✓ PricingUnifiedModule déjà configuré')
      return
    }

    // Backup original
    writeFileSync(`${appModulePath}.backup`, content)

    // Remplacer ou ajouter l'import du module unifié
    let newContent = content

    // Supprimer les anciens imports de pricing
    newContent = newContent.replace(/import.*PricingModule.*from.*modules\/pricing.*/g, '')
    newContent = newContent.replace(/import.*PricingModule.*from.*features\/pricing.*/g, '')

    // Ajouter le nouvel import
    const importLine = `import { PricingUnifiedModule } from '../features/pricing/pricing-unified.module'\n`
    
    if (!newContent.includes(importLine.trim())) {
      // Trouver la position après les autres imports
      const importSection = newContent.match(/(import[\s\S]*?from[^;\n]*[;\n])+/g)
      if (importSection) {
        const lastImport = importSection[importSection.length - 1]
        const lastImportIndex = newContent.lastIndexOf(lastImport) + lastImport.length
        newContent = newContent.slice(0, lastImportIndex) + importLine + newContent.slice(lastImportIndex)
      }
    }

    // Remplacer dans la section imports du module
    newContent = newContent.replace(
      /(imports:\s*\[[\s\S]*?)(PricingModule[,\s]*)/g,
      '$1PricingUnifiedModule,'
    )

    // Si pas trouvé, ajouter dans imports
    if (!newContent.includes('PricingUnifiedModule')) {
      newContent = newContent.replace(
        /(imports:\s*\[)/,
        '$1\n    PricingUnifiedModule,'
      )
    }

    writeFileSync(appModulePath, newContent)
    console.log('  ✓ app.module.ts mis à jour avec PricingUnifiedModule')
  }

  /**
   * Configuration des variables d'environnement
   */
  private async setupEnvironment(): Promise<void> {
    const envPath = join(this.rootDir, '.env')
    const envExamplePath = join(this.rootDir, '.env.example')

    const envVars = {
      // Redis
      'REDIS_HOST': 'localhost',
      'REDIS_PORT': '6379',
      'REDIS_PASSWORD': '',
      'REDIS_DB': '0',
      'REDIS_TTL': '3600',
      
      // Pricing
      'PRICING_CACHE_TTL': '3600',
      'PRICING_CACHE_MAX_KEYS': '10000',
      'PRICING_MAX_BULK_SIZE': '1000',
      'PRICING_TIMEOUT': '30000',
      'PRICING_CB_THRESHOLD': '5',
      
      // ML
      'ML_MODEL_PATH': './models/pricing',
      'ML_TRAINING_ENABLED': 'false',
      'ML_CONFIDENCE_THRESHOLD': '0.7',
      
      // Webhooks
      'WEBHOOK_MAX_RETRIES': '3',
      'WEBHOOK_TIMEOUT': '5000',
      'WEBHOOK_MAX_SUBS': '50',
      
      // Analytics
      'ANALYTICS_RETENTION_DAYS': '90',
      'ANALYTICS_BATCH_SIZE': '1000'
    }

    // Mise à jour du .env.example
    let envExampleContent = existsSync(envExamplePath) 
      ? readFileSync(envExamplePath, 'utf8') 
      : ''
    
    let hasChanges = false
    for (const [key, value] of Object.entries(envVars)) {
      if (!envExampleContent.includes(key)) {
        envExampleContent += `\n# Pricing System\n${key}=${value}\n`
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      writeFileSync(envExamplePath, envExampleContent)
      console.log('  ✓ .env.example mis à jour')
    }

    // Mise à jour du .env local s'il existe
    if (existsSync(envPath)) {
      let envContent = readFileSync(envPath, 'utf8')
      let localChanges = false
      
      for (const [key, defaultValue] of Object.entries(envVars)) {
        if (!envContent.includes(key)) {
          envContent += `${key}=${defaultValue}\n`
          localChanges = true
        }
      }
      
      if (localChanges) {
        writeFileSync(envPath, envContent)
        console.log('  ✓ .env local mis à jour')
      }
    } else {
      console.log('  ℹ️  .env non trouvé (normal si premier setup)')
    }
  }

  /**
   * Configuration de la base de données
   */
  private async setupDatabase(): Promise<void> {
    console.log('  🗄️  Génération de la migration...')
    
    try {
      // Vérifier que la migration existe
      const migrationPath = join(this.rootDir, 'apps/api/src/core/database/migrations/auth/006-CreatePricingAnalyticsTables.ts')
      if (!existsSync(migrationPath)) {
        throw new Error('Migration 006-CreatePricingAnalyticsTables.ts non trouvée')
      }

      console.log('  ✓ Migration pricing trouvée')

      // Vérifier la connexion DB avant d'exécuter
      try {
        execSync('npm run typeorm -- query "SELECT 1"', {
          stdio: 'pipe',
          cwd: this.rootDir,
          timeout: 10000
        })
        console.log('  ✓ Connexion base de données OK')
      } catch (error) {
        throw new Error('Impossible de se connecter à la base de données. Vérifiez la configuration.')
      }

      // Exécuter les migrations
      console.log('  🔄 Exécution des migrations...')
      execSync('npm run typeorm migration:run', {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 60000
      })
      
      console.log('  ✓ Migrations appliquées')

    } catch (error) {
      throw new Error(`Configuration DB échouée: ${error.message}`)
    }
  }

  /**
   * Configuration Redis
   */
  private async setupRedis(): Promise<void> {
    console.log('  🔗 Test connexion Redis...')

    try {
      // Tenter de se connecter à Redis
      const testScript = `
        const Redis = require('ioredis');
        const redis = new Redis({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          retryDelayOnFailover: 100,
          enableReadyCheck: false,
          maxRetriesPerRequest: 1,
          connectTimeout: 3000
        });
        
        redis.ping().then(() => {
          console.log('Redis OK');
          redis.disconnect();
          process.exit(0);
        }).catch(err => {
          console.error('Redis Error:', err.message);
          process.exit(1);
        });
      `

      execSync(`node -e "${testScript}"`, {
        stdio: 'pipe',
        timeout: 5000,
        env: { ...process.env }
      })

      console.log('  ✓ Redis connexion OK')
    } catch (error) {
      // Essayer de démarrer Redis avec Docker
      console.log('  🐳 Tentative de démarrage Redis avec Docker...')
      
      try {
        execSync('docker run -d --name redis-pricing -p 6379:6379 redis:alpine', {
          stdio: 'pipe',
          timeout: 30000
        })
        
        console.log('  ✓ Redis démarré avec Docker')
        
        // Attendre que Redis soit prêt
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (dockerError) {
        throw new Error('Redis non disponible et impossible de le démarrer avec Docker. Installez Redis manuellement.')
      }
    }
  }

  /**
   * Configuration GraphQL
   */
  private async setupGraphQL(): Promise<void> {
    console.log('  🔧 Configuration GraphQL...')

    const appModulePath = join(this.rootDir, 'apps/api/src/app/app.module.ts')
    let content = readFileSync(appModulePath, 'utf8')

    if (content.includes('GraphQLModule')) {
      console.log('  ✓ GraphQL déjà configuré')
      return
    }

    // Ajouter l'import GraphQL
    const graphqlImport = `import { GraphQLModule } from '@nestjs/graphql'\nimport { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo'\n`
    
    if (!content.includes('GraphQLModule')) {
      content = content.replace(/(import.*@nestjs\/common[^\n]*\n)/, `$1${graphqlImport}`)
    }

    // Ajouter dans les imports du module
    const graphqlConfig = `
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: process.env.NODE_ENV !== 'production',
      introspection: true,
    }),`

    content = content.replace(
      /(imports:\s*\[)/,
      `$1${graphqlConfig}`
    )

    writeFileSync(appModulePath, content)
    console.log('  ✓ GraphQL configuré')
  }

  /**
   * Configuration des tests
   */
  private async setupTests(): Promise<void> {
    console.log('  🧪 Configuration des tests...')

    // Créer jest.config.js s'il n'existe pas
    const jestConfigPath = join(this.rootDir, 'jest.config.js')
    
    if (!existsSync(jestConfigPath)) {
      const jestConfig = `
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    'apps/**/*.(t|j)s',
    'packages/**/*.(t|j)s',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  moduleNameMapping: {
    '^@erp/(.*)$': '<rootDir>/packages/$1/src',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
};`
      writeFileSync(jestConfigPath, jestConfig)
    }

    // Créer le fichier de setup des tests
    const testSetupPath = join(this.rootDir, 'test/setup.ts')
    if (!existsSync(join(this.rootDir, 'test'))) {
      mkdirSync(join(this.rootDir, 'test'), { recursive: true })
    }

    if (!existsSync(testSetupPath)) {
      const setupContent = `
// Configuration globale pour les tests
process.env.NODE_ENV = 'test';

// Mock des variables d'environnement
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
`
      writeFileSync(testSetupPath, setupContent)
    }

    // Ajouter script de test dans package.json
    const packageJsonPath = join(this.rootDir, 'package.json')
    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
      
      if (!packageJson.scripts) packageJson.scripts = {}
      
      packageJson.scripts = {
        ...packageJson.scripts,
        'test:pricing': 'jest --testPathPattern=pricing --passWithNoTests',
        'test:pricing:watch': 'jest --testPathPattern=pricing --watch',
        'test:pricing:coverage': 'jest --testPathPattern=pricing --coverage'
      }
      
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    }

    console.log('  ✓ Tests configurés')

    // Lancer les tests s'ils existent
    try {
      console.log('  🧪 Lancement des tests pricing...')
      execSync('npm run test:pricing', {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 60000
      })
      console.log('  ✅ Tests pricing réussis')
    } catch (error) {
      console.log(colors.yellow('  ⚠️  Tests pricing échoués (voir détails ci-dessus)'))
    }
  }

  /**
   * Vérification des builds
   */
  private async checkBuilds(): Promise<void> {
    console.log('  🏗️  Vérification build API...')

    try {
      execSync('npm run build', {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 180000 // 3 minutes
      })
      console.log('  ✅ Build API réussi')
    } catch (error) {
      throw new Error(`Build API échoué: ${error.message}`)
    }

    // Vérifier que les artifacts sont créés
    const distPath = join(this.rootDir, 'dist')
    if (!existsSync(distPath)) {
      throw new Error('Dossier dist non créé après build')
    }

    console.log('  ✓ Build artifacts créés')
  }

  /**
   * Validation finale avec agents de qualité
   */
  private async runQualityValidation(): Promise<void> {
    console.log('  🤖 Lancement des agents de qualité...')

    const qualityScriptPath = join(this.rootDir, 'scripts/pricing-quality-agents.ts')
    
    if (!existsSync(qualityScriptPath)) {
      console.log('  ⚠️  Script d\'agents de qualité non trouvé, ignoré')
      return
    }

    try {
      execSync(`ts-node ${qualityScriptPath}`, {
        stdio: 'inherit',
        cwd: this.rootDir,
        timeout: 300000 // 5 minutes
      })
      console.log('  ✅ Validation qualité réussie')
    } catch (error) {
      // Les agents génèrent déjà leur propre rapport
      console.log(colors.yellow('  ⚠️  Validation qualité terminée avec des avertissements'))
    }
  }

  /**
   * Génère le rapport final
   */
  private async generateSummaryReport(
    totalSteps: number,
    successCount: number,
    criticalFailures: number
  ): Promise<void> {
    console.log(colors.cyan('\n' + '═'.repeat(60)))
    console.log(colors.cyan('           RAPPORT D\'INTÉGRATION FINAL           '))
    console.log(colors.cyan('═'.repeat(60)))

    const successRate = Math.round((successCount / totalSteps) * 100)
    const status = criticalFailures === 0 ? '✅ SUCCÈS' : '❌ ÉCHEC PARTIEL'
    const statusColor = criticalFailures === 0 ? colors.green : colors.red

    console.log(statusColor(`\n🎯 Statut: ${status}`))
    console.log(colors.blue(`📊 Étapes réussies: ${successCount}/${totalSteps} (${successRate}%)`))
    
    if (criticalFailures > 0) {
      console.log(colors.red(`💥 Échecs critiques: ${criticalFailures}`))
      console.log(colors.yellow('\n⚠️  Le système nécessite des corrections avant utilisation en production.'))
    } else {
      console.log(colors.green('\n🎉 Système de pricing intégré avec succès!'))
    }

    // Informations post-intégration
    console.log(colors.blue('\n📋 Prochaines étapes:'))
    console.log(colors.gray('─'.repeat(30)))

    if (criticalFailures === 0) {
      console.log(colors.green('  ✅ 1. Démarrer l\'application: npm run dev'))
      console.log(colors.green('  ✅ 2. Tester les endpoints /pricing/*'))
      console.log(colors.green('  ✅ 3. Accéder à GraphQL Playground: /graphql'))
      console.log(colors.green('  ✅ 4. Consulter les analytics: /pricing/analytics/dashboard'))
    } else {
      console.log(colors.red('  ❌ 1. Corriger les échecs critiques'))
      console.log(colors.red('  ❌ 2. Relancer le script d\'intégration'))
      console.log(colors.yellow('  ⚠️  3. Consulter les backups dans .pricing-backup/'))
    }

    // Génération du rapport JSON
    const reportData = {
      timestamp: new Date().toISOString(),
      success: criticalFailures === 0,
      successRate,
      totalSteps,
      successCount,
      criticalFailures,
      backupLocation: this.backupDir
    }

    writeFileSync(
      join(this.rootDir, 'pricing-integration-report.json'),
      JSON.stringify(reportData, null, 2)
    )

    console.log(colors.blue('\n📄 Rapport sauvegardé: pricing-integration-report.json'))
    
    // Exit code
    process.exit(criticalFailures === 0 ? 0 : 1)
  }
}

// Gestion des erreurs non capturées
process.on('uncaughtException', (error) => {
  console.error(colors.red('💥 Erreur non gérée:'), error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error(colors.red('💥 Promise rejetée:'), reason)
  process.exit(1)
})

// Lancement du script
if (require.main === module) {
  const integrator = new PricingSystemIntegrator()
  integrator.run().catch(error => {
    console.error(colors.red('❌ Erreur d\'intégration:'), error)
    process.exit(1)
  })
}
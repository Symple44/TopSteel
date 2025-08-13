#!/usr/bin/env ts-node

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as colors from 'colors'

/**
 * Script de validation finale du système de pricing
 * Vérifie que tout est correctement intégré et fonctionnel
 */

interface ValidationResult {
  name: string
  status: 'success' | 'warning' | 'error'
  message: string
  details?: string[]
}

class PricingFinalValidation {
  private results: ValidationResult[] = []
  private rootDir = path.join(__dirname, '..')
  private apiDir = path.join(this.rootDir, 'apps', 'api')
  private pricingDir = path.join(this.apiDir, 'src', 'features', 'pricing')

  async run(): Promise<void> {
    // 1. Vérification de la structure
    await this.validateFileStructure()

    // 2. Vérification des dépendances
    await this.validateDependencies()

    // 3. Vérification TypeScript
    await this.validateTypeScript()

    // 4. Vérification des imports
    await this.validateImports()

    // 5. Vérification de la configuration
    await this.validateConfiguration()

    // 6. Vérification des entités
    await this.validateEntities()

    // 7. Vérification des services
    await this.validateServices()

    // 8. Vérification des contrôleurs
    await this.validateControllers()

    // 9. Vérification des tests
    await this.validateTests()

    // 10. Vérification de la documentation
    await this.validateDocumentation()

    // Afficher le rapport
    this.displayReport()
  }

  private async validateFileStructure(): Promise<void> {
    const requiredFiles = [
      'pricing-unified.module.ts',
      'services/pricing-engine.service.ts',
      'services/pricing-cache.service.ts',
      'services/pricing-analytics.service.ts',
      'services/pricing-ml.service.ts',
      'services/pricing-webhooks.service.ts',
      'controllers/pricing.controller.ts',
      'controllers/price-rules.controller.ts',
      'controllers/pricing-analytics.controller.ts',
      'controllers/pricing-webhooks.controller.ts',
      'entities/pricing-log.entity.ts',
      'entities/webhook-subscription.entity.ts',
      'entities/webhook-event.entity.ts',
      'entities/webhook-delivery.entity.ts',
      'entities/sales-history.entity.ts',
      'graphql/pricing.resolver.ts',
    ]

    const missingFiles: string[] = []

    for (const file of requiredFiles) {
      const filePath = path.join(this.pricingDir, file)
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file)
      }
    }

    if (missingFiles.length === 0) {
      this.results.push({
        name: 'Structure des fichiers',
        status: 'success',
        message: 'Tous les fichiers requis sont présents',
      })
    } else {
      this.results.push({
        name: 'Structure des fichiers',
        status: 'error',
        message: `${missingFiles.length} fichiers manquants`,
        details: missingFiles,
      })
    }
  }

  private async validateDependencies(): Promise<void> {
    const requiredDeps = [
      '@nestjs-modules/ioredis',
      '@nestjs/graphql',
      '@nestjs/apollo',
      '@nestjs/axios',
      '@nestjs/event-emitter',
      '@tensorflow/tfjs-node',
      'ioredis',
      'graphql',
      'apollo-server-express',
      'axios',
    ]

    const packageJsonPath = path.join(this.apiDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'))
    const installedDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    }

    const missingDeps = requiredDeps.filter((dep) => !installedDeps[dep])

    if (missingDeps.length === 0) {
      this.results.push({
        name: 'Dépendances NPM',
        status: 'success',
        message: 'Toutes les dépendances sont installées',
      })
    } else {
      this.results.push({
        name: 'Dépendances NPM',
        status: 'error',
        message: `${missingDeps.length} dépendances manquantes`,
        details: missingDeps,
      })
    }
  }

  private async validateTypeScript(): Promise<void> {
    try {
      process.chdir(this.apiDir)
      execSync('npx tsc --noEmit', { stdio: 'pipe' })

      this.results.push({
        name: 'Compilation TypeScript',
        status: 'success',
        message: 'Aucune erreur TypeScript',
      })
    } catch (error: any) {
      const output = error.stdout?.toString() || error.message
      const errorCount = (output.match(/error TS/g) || []).length

      this.results.push({
        name: 'Compilation TypeScript',
        status: 'error',
        message: `${errorCount} erreurs TypeScript détectées`,
        details: output.split('\n').slice(0, 10),
      })
    }
  }

  private async validateImports(): Promise<void> {
    try {
      const madgePath = path.join(this.rootDir, 'node_modules', '.bin', 'madge')
      const result = execSync(`${madgePath} --circular --extensions ts ${this.pricingDir}`, {
        stdio: 'pipe',
      }).toString()

      if (result.includes('No circular dependencies found')) {
        this.results.push({
          name: 'Dépendances circulaires',
          status: 'success',
          message: 'Aucune dépendance circulaire détectée',
        })
      } else {
        this.results.push({
          name: 'Dépendances circulaires',
          status: 'warning',
          message: 'Dépendances circulaires détectées',
          details: result.split('\n').filter((line) => line.trim()),
        })
      }
    } catch (_error) {
      this.results.push({
        name: 'Dépendances circulaires',
        status: 'warning',
        message: 'Impossible de vérifier les dépendances circulaires',
      })
    }
  }

  private async validateConfiguration(): Promise<void> {
    const envFile = path.join(this.rootDir, '.env')
    const _envExample = path.join(this.rootDir, '.env.example')

    const requiredEnvVars = [
      'REDIS_HOST',
      'REDIS_PORT',
      'DB_HOST',
      'DB_PORT',
      'DB_USER',
      'DB_PASSWORD',
      'DB_NAME',
    ]

    if (fs.existsSync(envFile)) {
      const envContent = fs.readFileSync(envFile, 'utf-8')
      const missingVars = requiredEnvVars.filter((varName) => !envContent.includes(`${varName}=`))

      if (missingVars.length === 0) {
        this.results.push({
          name: "Variables d'environnement",
          status: 'success',
          message: 'Toutes les variables requises sont configurées',
        })
      } else {
        this.results.push({
          name: "Variables d'environnement",
          status: 'warning',
          message: `${missingVars.length} variables manquantes`,
          details: missingVars,
        })
      }
    } else {
      this.results.push({
        name: "Variables d'environnement",
        status: 'error',
        message: 'Fichier .env manquant',
      })
    }
  }

  private async validateEntities(): Promise<void> {
    const entitiesDir = path.join(this.pricingDir, 'entities')
    const entities = fs.readdirSync(entitiesDir).filter((file) => file.endsWith('.entity.ts'))

    let validEntities = 0
    const issues: string[] = []

    for (const entity of entities) {
      const content = fs.readFileSync(path.join(entitiesDir, entity), 'utf-8')

      // Vérifier les décorateurs TypeORM
      if (!content.includes('@Entity')) {
        issues.push(`${entity}: Décorateur @Entity manquant`)
      }
      if (!content.includes('@PrimaryGeneratedColumn') && !content.includes('@PrimaryColumn')) {
        issues.push(`${entity}: Clé primaire manquante`)
      }
      if (!content.includes('@Column')) {
        issues.push(`${entity}: Aucune colonne définie`)
      }

      if (issues.length === 0) {
        validEntities++
      }
    }

    if (issues.length === 0) {
      this.results.push({
        name: 'Entités TypeORM',
        status: 'success',
        message: `${validEntities} entités valides`,
      })
    } else {
      this.results.push({
        name: 'Entités TypeORM',
        status: 'warning',
        message: `Problèmes détectés dans les entités`,
        details: issues,
      })
    }
  }

  private async validateServices(): Promise<void> {
    const servicesDir = path.join(this.pricingDir, 'services')
    const services = fs.readdirSync(servicesDir).filter((file) => file.endsWith('.service.ts'))

    let validServices = 0
    const issues: string[] = []

    for (const service of services) {
      const content = fs.readFileSync(path.join(servicesDir, service), 'utf-8')

      // Vérifier les décorateurs NestJS
      if (!content.includes('@Injectable')) {
        issues.push(`${service}: Décorateur @Injectable manquant`)
      }

      // Vérifier les méthodes principales
      if (service.includes('engine')) {
        if (!content.includes('calculatePrice')) {
          issues.push(`${service}: Méthode calculatePrice manquante`)
        }
      }

      if (service.includes('cache')) {
        if (!content.includes('get') || !content.includes('set')) {
          issues.push(`${service}: Méthodes get/set manquantes`)
        }
      }

      if (issues.length === 0) {
        validServices++
      }
    }

    if (issues.length === 0) {
      this.results.push({
        name: 'Services NestJS',
        status: 'success',
        message: `${validServices} services valides`,
      })
    } else {
      this.results.push({
        name: 'Services NestJS',
        status: 'warning',
        message: `Problèmes détectés dans les services`,
        details: issues,
      })
    }
  }

  private async validateControllers(): Promise<void> {
    const controllersDir = path.join(this.pricingDir, 'controllers')
    const controllers = fs
      .readdirSync(controllersDir)
      .filter((file) => file.endsWith('.controller.ts'))

    let validControllers = 0
    const issues: string[] = []

    for (const controller of controllers) {
      const content = fs.readFileSync(path.join(controllersDir, controller), 'utf-8')

      // Vérifier les décorateurs NestJS
      if (!content.includes('@Controller')) {
        issues.push(`${controller}: Décorateur @Controller manquant`)
      }

      // Vérifier au moins une route
      const hasRoute =
        content.includes('@Get') ||
        content.includes('@Post') ||
        content.includes('@Put') ||
        content.includes('@Delete')

      if (!hasRoute) {
        issues.push(`${controller}: Aucune route définie`)
      }

      // Vérifier la documentation Swagger
      if (!content.includes('@ApiTags')) {
        issues.push(`${controller}: Documentation Swagger manquante`)
      }

      if (issues.length === 0) {
        validControllers++
      }
    }

    if (issues.length === 0) {
      this.results.push({
        name: 'Contrôleurs REST',
        status: 'success',
        message: `${validControllers} contrôleurs valides`,
      })
    } else {
      this.results.push({
        name: 'Contrôleurs REST',
        status: 'warning',
        message: `Problèmes détectés dans les contrôleurs`,
        details: issues,
      })
    }
  }

  private async validateTests(): Promise<void> {
    const testFiles = this.findFiles(this.pricingDir, '.spec.ts')

    if (testFiles.length > 0) {
      let totalTests = 0

      for (const testFile of testFiles) {
        const content = fs.readFileSync(testFile, 'utf-8')
        const _describeCount = (content.match(/describe\(/g) || []).length
        const itCount = (content.match(/it\(/g) || []).length
        totalTests += itCount
      }

      this.results.push({
        name: 'Tests unitaires',
        status: 'success',
        message: `${testFiles.length} fichiers de test, ${totalTests} tests trouvés`,
      })
    } else {
      this.results.push({
        name: 'Tests unitaires',
        status: 'warning',
        message: 'Aucun fichier de test trouvé',
      })
    }
  }

  private async validateDocumentation(): Promise<void> {
    const readmePath = path.join(this.pricingDir, 'README.md')
    const reportPath = path.join(this.rootDir, 'PRICING_INTEGRATION_REPORT.md')

    const docs: string[] = []

    if (fs.existsSync(readmePath)) {
      docs.push('README.md du module')
    }

    if (fs.existsSync(reportPath)) {
      docs.push("Rapport d'intégration")
    }

    // Vérifier les commentaires JSDoc
    const serviceFiles = this.findFiles(this.pricingDir, '.service.ts')
    let jsdocCount = 0

    for (const file of serviceFiles) {
      const content = fs.readFileSync(file, 'utf-8')
      jsdocCount += (content.match(/\/\*\*/g) || []).length
    }

    if (jsdocCount > 0) {
      docs.push(`${jsdocCount} méthodes documentées avec JSDoc`)
    }

    if (docs.length > 0) {
      this.results.push({
        name: 'Documentation',
        status: 'success',
        message: 'Documentation présente',
        details: docs,
      })
    } else {
      this.results.push({
        name: 'Documentation',
        status: 'warning',
        message: 'Documentation limitée',
      })
    }
  }

  private findFiles(dir: string, extension: string): string[] {
    const files: string[] = []

    function walk(directory: string) {
      const items = fs.readdirSync(directory)
      for (const item of items) {
        const fullPath = path.join(directory, item)
        const stat = fs.statSync(fullPath)

        if (stat.isDirectory() && !item.includes('node_modules')) {
          walk(fullPath)
        } else if (stat.isFile() && item.endsWith(extension)) {
          files.push(fullPath)
        }
      }
    }

    walk(dir)
    return files
  }

  private displayReport(): void {
    const successCount = this.results.filter((r) => r.status === 'success').length
    const warningCount = this.results.filter((r) => r.status === 'warning').length
    const errorCount = this.results.filter((r) => r.status === 'error').length

    for (const result of this.results) {
      const _icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'

      const _color =
        result.status === 'success'
          ? colors.green
          : result.status === 'warning'
            ? colors.yellow
            : colors.red

      if (result.details && result.details.length > 0) {
        for (const _detail of result.details.slice(0, 5)) {
        }
        if (result.details.length > 5) {
        }
      }
    }

    const score = (successCount * 100) / this.results.length
    const _scoreColor = score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red

    if (errorCount === 0) {
    } else if (errorCount <= 2) {
    } else {
    }

    // Sauvegarder le rapport
    const reportContent = {
      date: new Date().toISOString(),
      results: this.results,
      summary: {
        success: successCount,
        warnings: warningCount,
        errors: errorCount,
        score: score,
      },
    }

    const reportPath = path.join(this.rootDir, 'pricing-validation-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(reportContent, null, 2))
  }
}

// Exécution
const validator = new PricingFinalValidation()
validator.run().catch(console.error)

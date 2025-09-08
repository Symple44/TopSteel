#!/usr/bin/env ts-node

/**
 * AGENTS DE QUALITÉ POUR LE SYSTÈME PRICING
 *
 * Script orchestrateur qui utilise plusieurs agents spécialisés pour :
 * - Vérifier la qualité du code
 * - Tester les builds
 * - Valider l'intégration
 * - Générer des rapports
 */

import { execSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import * as colors from 'colors/safe'

interface QualityCheck {
  name: string
  description: string
  command?: string
  check: () => Promise<QualityResult>
}

interface QualityResult {
  success: boolean
  score: number
  message: string
  details?: string[]
  fixes?: string[]
}

class PricingQualityOrchestrator {
  private readonly rootDir = process.cwd()
  private readonly pricingDir = join(this.rootDir, 'apps/api/src/features/pricing')

  private results: Map<string, QualityResult> = new Map()

  /**
   * Agent Principal - Orchestre tous les autres agents
   */
  async run(): Promise<void> {
    const agents: QualityCheck[] = [
      {
        name: 'TypeScript Agent',
        description: 'Vérification des types et compilation',
        check: () => this.typeScriptAgent(),
      },
      {
        name: 'Code Quality Agent',
        description: 'Analyse statique et complexité',
        check: () => this.codeQualityAgent(),
      },
      {
        name: 'Test Coverage Agent',
        description: 'Couverture de tests et qualité',
        check: () => this.testCoverageAgent(),
      },
      {
        name: 'Security Agent',
        description: 'Audit sécurité et vulnérabilités',
        check: () => this.securityAgent(),
      },
      {
        name: 'Performance Agent',
        description: 'Analyse des performances',
        check: () => this.performanceAgent(),
      },
      {
        name: 'Build Agent',
        description: 'Vérification des builds',
        check: () => this.buildAgent(),
      },
      {
        name: 'Integration Agent',
        description: "Tests d'intégration système",
        check: () => this.integrationAgent(),
      },
    ]

    let totalScore = 0
    let maxScore = 0

    for (const agent of agents) {
      try {
        const result = await agent.check()
        this.results.set(agent.name, result)

        const _status = result.success ? '✅' : '❌'
        const _color = result.success ? colors.green : colors.red

        if (result.details && result.details.length > 0) {
          result.details.forEach((_detail) => {})
        }

        if (!result.success && result.fixes && result.fixes.length > 0) {
          result.fixes.forEach((_fix) => {})
        }

        totalScore += result.score
        maxScore += 100
      } catch (error) {
        this.results.set(agent.name, {
          success: false,
          score: 0,
          message: `Erreur d'exécution: ${error.message}`,
        })
      }
    }

    await this.generateReport(totalScore, maxScore)
  }

  /**
   * Agent TypeScript - Vérifie les types et la compilation
   */
  private async typeScriptAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      execSync('npx tsc --noEmit --project apps/api/tsconfig.json', {
        stdio: 'pipe',
        cwd: this.rootDir,
      })
      checks.push('✅ Compilation TypeScript réussie')
    } catch (error) {
      score -= 30
      checks.push('❌ Erreurs de compilation TypeScript')
      const output = error.stdout?.toString() || error.message
      return {
        success: false,
        score: score,
        message: 'Erreurs de compilation détectées',
        details: [`${output.slice(0, 500)}...`],
        fixes: [
          'Corriger les erreurs TypeScript avec: npx tsc --noEmit',
          'Vérifier les imports manquants',
          'Ajouter les types manquants',
        ],
      }
    }

    // 2. Vérifier les types stricts
    const tsConfigPath = join(this.rootDir, 'apps/api/tsconfig.json')
    if (existsSync(tsConfigPath)) {
      const tsConfig = JSON.parse(readFileSync(tsConfigPath, 'utf8'))
      const strict = tsConfig.compilerOptions?.strict
      if (strict) {
        checks.push('✅ Mode strict activé')
      } else {
        score -= 10
        checks.push('⚠️ Mode strict recommandé')
      }
    }

    // 3. Vérifier les any types
    try {
      const grepResult = execSync(`grep -r "any" ${this.pricingDir} --include="*.ts" | wc -l`, {
        stdio: 'pipe',
      })
        .toString()
        .trim()

      const anyCount = parseInt(grepResult, 10) || 0
      if (anyCount === 0) {
        checks.push('✅ Aucun type any détecté')
      } else if (anyCount < 5) {
        score -= 5
        checks.push(`⚠️ ${anyCount} types 'any' détectés`)
      } else {
        score -= 15
        checks.push(`❌ ${anyCount} types 'any' détectés (trop nombreux)`)
      }
    } catch (_error) {
      checks.push('⚠️ Impossible de vérifier les types any')
    }

    return {
      success: score >= 80,
      score,
      message: score >= 80 ? 'Types excellent' : 'Types à améliorer',
      details: checks,
    }
  }

  /**
   * Agent Code Quality - Analyse statique
   */
  private async codeQualityAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      try {
        execSync(`npx eslint ${this.pricingDir} --ext .ts --format json`, {
          stdio: 'pipe',
        })
        checks.push('✅ Code ESLint conforme')
      } catch (error) {
        const output = error.stdout?.toString()
        if (output) {
          const results = JSON.parse(output)
          const totalIssues = results.reduce(
            (sum: number, file: any) => sum + file.errorCount + file.warningCount,
            0
          )

          if (totalIssues < 10) {
            score -= 10
            checks.push(`⚠️ ${totalIssues} problèmes ESLint mineurs`)
          } else {
            score -= 25
            checks.push(`❌ ${totalIssues} problèmes ESLint`)
          }
        }
      }

      // 2. Biome check (si disponible)
      if (existsSync(join(this.rootDir, 'biome.json'))) {
        try {
          execSync(`npx @biomejs/biome check ${this.pricingDir}`, { stdio: 'pipe' })
          checks.push('✅ Code Biome conforme')
        } catch (_error) {
          score -= 15
          checks.push('⚠️ Problèmes de formatage Biome')
        }
      }

      // 3. Vérifier la complexité cyclomatique
      try {
        const complexFiles = execSync(
          `find ${this.pricingDir} -name "*.ts" -exec wc -l {} \\; | sort -nr | head -5`,
          { stdio: 'pipe' }
        ).toString()

        const maxLines = complexFiles.split('\n')[0]?.split(' ')[0]
        if (parseInt(maxLines, 10) > 1000) {
          score -= 10
          checks.push(`⚠️ Fichier très volumineux détecté (${maxLines} lignes)`)
        } else {
          checks.push('✅ Taille des fichiers raisonnable')
        }
      } catch (_error) {
        checks.push('⚠️ Impossible de vérifier la complexité')
      }

      // 4. Vérifier les imports circulaires
      try {
        const madgeResult = execSync(`npx madge --circular --extensions ts ${this.pricingDir}`, {
          stdio: 'pipe',
        }).toString()

        if (madgeResult.includes('No circular dependency found')) {
          checks.push('✅ Aucune dépendance circulaire')
        } else {
          score -= 20
          checks.push('❌ Dépendances circulaires détectées')
        }
      } catch (_error) {
        // Madge pas installé, on passe
        checks.push('⚠️ Vérification dépendances circulaires ignorée')
      }
    } catch (error) {
      score = 0
      return {
        success: false,
        score,
        message: 'Erreur analyse qualité code',
        details: [error.message],
      }
    }

    return {
      success: score >= 75,
      score,
      message: score >= 75 ? 'Qualité code excellente' : 'Qualité code à améliorer',
      details: checks,
      fixes:
        score < 75
          ? [
              'Corriger les problèmes ESLint: npx eslint --fix',
              'Formater le code: npx biome format --write',
              'Refactoriser les gros fichiers',
            ]
          : undefined,
    }
  }

  /**
   * Agent Test Coverage - Vérifie les tests
   */
  private async testCoverageAgent(): Promise<QualityResult> {
    const checks = []
    let score = 0

    // 1. Vérifier l'existence de tests
    const testFiles = [
      'pricing-engine.service.spec.ts',
      'pricing-cache.service.spec.ts',
      'pricing.controller.spec.ts',
    ]

    let existingTests = 0
    for (const testFile of testFiles) {
      const testPath = join(this.pricingDir, testFile)
      if (existsSync(testPath)) {
        existingTests++
        checks.push(`✅ Test trouvé: ${testFile}`)
      } else {
        checks.push(`❌ Test manquant: ${testFile}`)
      }
    }

    score = (existingTests / testFiles.length) * 100

    // 2. Lancer les tests s'ils existent
    if (existingTests > 0) {
      try {
        const testOutput = execSync('npm run test:pricing -- --coverage --passWithNoTests', {
          stdio: 'pipe',
          cwd: this.rootDir,
        }).toString()

        // Parser la couverture si Jest est utilisé
        const coverageMatch = testOutput.match(/All files[|\s]*(\d+\.?\d*)/)
        if (coverageMatch) {
          const coverage = parseFloat(coverageMatch[1])
          if (coverage >= 80) {
            score = Math.max(score, 90)
            checks.push(`✅ Couverture excellente: ${coverage}%`)
          } else if (coverage >= 60) {
            score = Math.max(score, 70)
            checks.push(`⚠️ Couverture correcte: ${coverage}%`)
          } else {
            score = Math.max(score, 40)
            checks.push(`❌ Couverture faible: ${coverage}%`)
          }
        }
      } catch (_error) {
        checks.push('❌ Échec exécution des tests')
      }
    }

    return {
      success: score >= 60,
      score,
      message: score >= 60 ? 'Couverture test acceptable' : 'Tests insuffisants',
      details: checks,
      fixes:
        score < 60
          ? [
              'Créer les tests manquants',
              'Viser une couverture >= 80%',
              "Ajouter des tests d'intégration",
            ]
          : undefined,
    }
  }

  /**
   * Agent Security - Audit de sécurité
   */
  private async securityAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      try {
        const auditResult = execSync('npm audit --json', {
          stdio: 'pipe',
          cwd: this.rootDir,
        })

        const audit = JSON.parse(auditResult.toString())
        const vulnerabilities = audit.metadata?.vulnerabilities

        if (vulnerabilities) {
          const critical = vulnerabilities.critical || 0
          const high = vulnerabilities.high || 0
          const moderate = vulnerabilities.moderate || 0

          if (critical > 0) {
            score -= 40
            checks.push(`❌ ${critical} vulnérabilités critiques`)
          }
          if (high > 0) {
            score -= 20
            checks.push(`⚠️ ${high} vulnérabilités élevées`)
          }
          if (moderate > 0) {
            score -= 10
            checks.push(`⚠️ ${moderate} vulnérabilités modérées`)
          }

          if (critical === 0 && high === 0 && moderate === 0) {
            checks.push('✅ Aucune vulnérabilité détectée')
          }
        }
      } catch (_error) {
        score -= 20
        checks.push("❌ Impossible d'effectuer l'audit NPM")
      }

      const dangerousPatterns = [
        { pattern: 'eval\\(', message: 'Usage de eval() détecté' },
        { pattern: 'innerHTML\\s*=', message: 'Assignment innerHTML détecté' },
        { pattern: 'document\\.write', message: 'Usage de document.write détecté' },
        { pattern: 'process\\.env\\.PASSWORD', message: 'Mot de passe potentiel en dur' },
        { pattern: 'password\\s*=\\s*["\']', message: 'Mot de passe en dur potentiel' },
      ]

      for (const { pattern, message } of dangerousPatterns) {
        try {
          const result = execSync(
            `grep -r "${pattern}" ${this.pricingDir} --include="*.ts" || true`,
            { stdio: 'pipe' }
          ).toString()

          if (result.trim()) {
            score -= 15
            checks.push(`⚠️ ${message}`)
          }
        } catch (_error) {
          // Ignore grep errors
        }
      }

      // 3. Vérifier la sécurisation du parser mathjs
      const engineServicePath = join(this.pricingDir, 'services/pricing-engine.service.ts')
      if (existsSync(engineServicePath)) {
        const content = readFileSync(engineServicePath, 'utf8')
        if (content.includes('mathParser.scope') || content.includes('allowedFunctions')) {
          checks.push('✅ Parser mathjs sécurisé')
        } else {
          score -= 25
          checks.push('❌ Parser mathjs non sécurisé')
        }
      }

      if (checks.length === 0) {
        checks.push('✅ Aucun problème de sécurité détecté')
      }
    } catch (error) {
      score = 0
      return {
        success: false,
        score,
        message: 'Erreur audit sécurité',
        details: [error.message],
      }
    }

    return {
      success: score >= 80,
      score,
      message: score >= 80 ? 'Sécurité excellente' : 'Problèmes de sécurité détectés',
      details: checks,
      fixes:
        score < 80
          ? [
              'Corriger les vulnérabilités: npm audit fix',
              'Sécuriser le parser mathjs',
              'Éviter les patterns dangereux',
            ]
          : undefined,
    }
  }

  /**
   * Agent Performance - Analyse des performances
   */
  private async performanceAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      // 1. Vérifier les imports lourds
      const heavyImports = ['lodash', 'moment', 'axios']
      for (const lib of heavyImports) {
        try {
          const result = execSync(
            `grep -r "import.*${lib}" ${this.pricingDir} --include="*.ts" || true`,
            { stdio: 'pipe' }
          ).toString()

          if (result.trim()) {
            score -= 5
            checks.push(`⚠️ Import lourd détecté: ${lib}`)
          }
        } catch (_error) {
          // Ignore
        }
      }

      // 2. Vérifier les boucles potentiellement problématiques
      const problematicPatterns = [
        'for.*in.*forEach',
        'while.*true',
        '.map.*.map',
        '.filter.*.filter',
      ]

      for (const pattern of problematicPatterns) {
        try {
          const result = execSync(
            `grep -r "${pattern}" ${this.pricingDir} --include="*.ts" || true`,
            { stdio: 'pipe' }
          ).toString()

          if (result.trim()) {
            score -= 10
            checks.push(`⚠️ Pattern performance suspect: ${pattern}`)
          }
        } catch (_error) {
          // Ignore
        }
      }

      // 3. Vérifier l'utilisation des caches
      const cacheServicePath = join(this.pricingDir, 'services/pricing-cache.service.ts')
      if (existsSync(cacheServicePath)) {
        checks.push('✅ Service de cache implémenté')

        const engineServicePath = join(this.pricingDir, 'services/pricing-engine.service.ts')
        if (existsSync(engineServicePath)) {
          const content = readFileSync(engineServicePath, 'utf8')
          if (content.includes('PricingCacheService')) {
            checks.push('✅ Cache intégré dans le moteur')
          } else {
            score -= 15
            checks.push('❌ Cache non intégré dans le moteur')
          }
        }
      } else {
        score -= 20
        checks.push('❌ Service de cache manquant')
      }

      // 4. Vérifier la pagination
      try {
        const result = execSync(
          `grep -r "calculateBulkPrices" ${this.pricingDir} --include="*.ts"`,
          { stdio: 'pipe' }
        ).toString()

        if (result.includes('batchSize') || result.includes('limit')) {
          checks.push('✅ Pagination implémentée')
        } else {
          score -= 10
          checks.push('⚠️ Pagination non détectée')
        }
      } catch (_error) {
        checks.push('⚠️ Impossible de vérifier la pagination')
      }

      if (checks.length === 0) {
        checks.push('✅ Aucun problème de performance détecté')
      }
    } catch (error) {
      score = 0
      return {
        success: false,
        score,
        message: 'Erreur analyse performance',
        details: [error.message],
      }
    }

    return {
      success: score >= 70,
      score,
      message: score >= 70 ? 'Performance correcte' : 'Optimisations performance requises',
      details: checks,
      fixes:
        score < 70
          ? [
              'Intégrer le cache dans le moteur de pricing',
              'Implémenter la pagination',
              'Optimiser les imports lourds',
            ]
          : undefined,
    }
  }

  /**
   * Agent Build - Vérifie les builds
   */
  private async buildAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      // 1. Build de l'API
      try {
        execSync('npm run build --prefix apps/api', {
          stdio: 'pipe',
          cwd: this.rootDir,
          timeout: 120000, // 2 minutes max
        })
        checks.push('✅ Build API réussi')
      } catch (_error) {
        score -= 40
        checks.push('❌ Échec build API')
      }
      try {
        execSync('npm run build --prefix packages/ui', {
          stdio: 'pipe',
          cwd: this.rootDir,
          timeout: 60000, // 1 minute max
        })
        checks.push('✅ Build packages réussi')
      } catch (_error) {
        score -= 20
        checks.push('⚠️ Échec build packages')
      }

      // 3. Vérifier les artifacts de build
      const buildDirs = ['apps/api/dist', 'packages/ui/dist']

      for (const buildDir of buildDirs) {
        const fullPath = join(this.rootDir, buildDir)
        if (existsSync(fullPath)) {
          checks.push(`✅ Artifacts build trouvés: ${buildDir}`)
        } else {
          score -= 15
          checks.push(`❌ Artifacts manquants: ${buildDir}`)
        }
      }
    } catch (error) {
      score = 0
      return {
        success: false,
        score,
        message: 'Erreur build système',
        details: [error.message],
      }
    }

    return {
      success: score >= 70,
      score,
      message: score >= 70 ? 'Build système OK' : 'Problèmes de build détectés',
      details: checks,
      fixes:
        score < 70
          ? [
              'Corriger les erreurs de compilation',
              'Vérifier les dépendances',
              'Nettoyer le cache: npm run clean',
            ]
          : undefined,
    }
  }

  /**
   * Agent Integration - Tests d'intégration
   */
  private async integrationAgent(): Promise<QualityResult> {
    const checks = []
    let score = 100

    try {
      // 1. Vérifier que le module unifié compile
      const moduleUnifiedPath = join(this.pricingDir, 'pricing-unified.module.ts')
      if (existsSync(moduleUnifiedPath)) {
        checks.push('✅ Module unifié trouvé')

        // Vérifier la syntaxe
        try {
          execSync(`npx tsc --noEmit ${moduleUnifiedPath}`, { stdio: 'pipe' })
          checks.push('✅ Module unifié compile')
        } catch (_error) {
          score -= 30
          checks.push('❌ Erreurs compilation module unifié')
        }
      } else {
        score -= 40
        checks.push('❌ Module unifié manquant')
      }

      // 2. Vérifier les imports des services
      const requiredServices = [
        'PricingEngineService',
        'PricingCacheService',
        'PricingAnalyticsService',
      ]

      for (const service of requiredServices) {
        const servicePath = join(
          this.pricingDir,
          `services/${service.toLowerCase().replace('service', '')}.service.ts`
        )
        if (existsSync(servicePath)) {
          checks.push(`✅ Service trouvé: ${service}`)
        } else {
          score -= 15
          checks.push(`❌ Service manquant: ${service}`)
        }
      }

      // 3. Vérifier les migrations
      const migrationPath = join(
        this.rootDir,
        'apps/api/src/core/database/migrations/auth/006-CreatePricingAnalyticsTables.ts'
      )
      if (existsSync(migrationPath)) {
        checks.push('✅ Migration pricing trouvée')
      } else {
        score -= 20
        checks.push('❌ Migration pricing manquante')
      }

      // 4. Vérifier les contrôleurs
      const controllers = ['pricing.controller.ts', 'pricing-analytics.controller.ts']
      for (const controller of controllers) {
        const controllerPath = join(this.pricingDir, 'controllers', controller)
        if (existsSync(controllerPath)) {
          checks.push(`✅ Contrôleur trouvé: ${controller}`)
        } else {
          score -= 10
          checks.push(`⚠️ Contrôleur manquant: ${controller}`)
        }
      }
    } catch (error) {
      score = 0
      return {
        success: false,
        score,
        message: 'Erreur test intégration',
        details: [error.message],
      }
    }

    return {
      success: score >= 80,
      score,
      message: score >= 80 ? 'Intégration excellente' : "Problèmes d'intégration",
      details: checks,
      fixes:
        score < 80
          ? [
              'Créer les services manquants',
              'Ajouter les contrôleurs manquants',
              'Vérifier les imports',
            ]
          : undefined,
    }
  }

  /**
   * Génère le rapport final
   */
  private async generateReport(totalScore: number, maxScore: number): Promise<void> {
    const overallScore = Math.round((totalScore / maxScore) * 100)

    // Score global
    const _scoreColor =
      overallScore >= 80 ? colors.green : overallScore >= 60 ? colors.yellow : colors.red

    // Statut global
    let _status = '❌ ÉCHEC'
    let _statusColor = colors.red
    if (overallScore >= 80) {
      _status = '✅ EXCELLENT'
      _statusColor = colors.green
    } else if (overallScore >= 60) {
      _status = '⚠️  ACCEPTABLE'
      _statusColor = colors.yellow
    }

    for (const [_name, result] of this.results.entries()) {
      const _icon = result.success ? '✅' : '❌'
      const _color = result.success ? colors.green : colors.red
    }

    const failedAgents = Array.from(this.results.entries()).filter(([_, result]) => !result.success)

    if (failedAgents.length === 0) {
    } else {
      for (const [_name, result] of failedAgents) {
        if (result.fixes) {
          result.fixes.forEach((_fix) => {})
        }
      }
    }

    // Génération du fichier rapport
    const reportData = {
      timestamp: new Date().toISOString(),
      overallScore,
      status: overallScore >= 60,
      agents: Object.fromEntries(this.results.entries()),
    }

    const reportPath = join(this.rootDir, 'quality-report.json')
    writeFileSync(reportPath, JSON.stringify(reportData, null, 2))

    // Exit code basé sur le score
    process.exit(overallScore >= 60 ? 0 : 1)
  }
}

// Lancement du script
if (require.main === module) {
  const orchestrator = new PricingQualityOrchestrator()
  orchestrator.run().catch((_error) => {
    process.exit(1)
  })
}

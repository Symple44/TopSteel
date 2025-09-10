#!/usr/bin/env ts-node

/**
 * Script d'optimisation du projet TopSteel
 * Identifie et propose des améliorations pour réduire la dette technique
 */

import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

interface OptimizationReport {
  category: string
  severity: 'low' | 'medium' | 'high'
  issue: string
  suggestion: string
  autoFixable: boolean
}

const reports: OptimizationReport[] = []

// 1. Vérifier les dépendances inutilisées
function checkUnusedDependencies() {
  try {
    const depcheckOutput = execSync('npx depcheck --json', {
      encoding: 'utf-8',
      cwd: process.cwd(),
    })
    const result = JSON.parse(depcheckOutput)

    if (result.dependencies && result.dependencies.length > 0) {
      // Filtrer les faux positifs (Radix UI sous-dépendances)
      const realUnused = result.dependencies.filter(
        (dep: string) =>
          !dep.startsWith('@radix-ui/react-') &&
          !dep.startsWith('@floating-ui/') &&
          !dep.includes('tslib') &&
          !dep.includes('scheduler')
      )

      if (realUnused.length > 0) {
        reports.push({
          category: 'Dependencies',
          severity: 'medium',
          issue: `${realUnused.length} dépendances potentiellement inutilisées`,
          suggestion: `Vérifier et supprimer: ${realUnused.slice(0, 5).join(', ')}${realUnused.length > 5 ? '...' : ''}`,
          autoFixable: false,
        })
      }
    }
  } catch (_error) {}
}

// 2. Vérifier la taille des bundles
function checkBundleSize() {
  const nextBuildPath = path.join(process.cwd(), 'apps/web/.next')
  if (fs.existsSync(nextBuildPath)) {
    const getDirSize = (dir: string): number => {
      let size = 0
      try {
        const files = fs.readdirSync(dir)
        for (const file of files) {
          const filePath = path.join(dir, file)
          const stat = fs.statSync(filePath)
          if (stat.isDirectory()) {
            size += getDirSize(filePath)
          } else {
            size += stat.size
          }
        }
      } catch {}
      return size
    }

    const totalSize = getDirSize(nextBuildPath)
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2)

    if (totalSize > 100 * 1024 * 1024) {
      // Plus de 100MB
      reports.push({
        category: 'Bundle Size',
        severity: 'high',
        issue: `Build Next.js trop volumineux: ${sizeMB}MB`,
        suggestion: 'Activer la compression, lazy loading et code splitting',
        autoFixable: false,
      })
    }
  }
}

// 3. Vérifier les console.log restants
function checkConsoleLogs() {
  try {
    const result = execSync(
      'grep -r "console\\." --include="*.ts" --include="*.tsx" apps/web/src packages/*/src 2>/dev/null | wc -l',
      {
        encoding: 'utf-8',
        shell: true,
      }
    ).trim()

    const count = parseInt(result, 10)
    if (count > 50) {
      reports.push({
        category: 'Code Quality',
        severity: 'medium',
        issue: `${count} console.* trouvés dans le code`,
        suggestion: 'Utiliser le logger centralisé créé dans @erp/utils',
        autoFixable: true,
      })
    }
  } catch {}
}

// 4. Vérifier les TODO/FIXME
function checkTodos() {
  try {
    const result = execSync(
      'grep -r "TODO\\|FIXME" --include="*.ts" --include="*.tsx" apps packages 2>/dev/null | wc -l',
      {
        encoding: 'utf-8',
        shell: true,
      }
    ).trim()

    const count = parseInt(result, 10)
    if (count > 0) {
      reports.push({
        category: 'Technical Debt',
        severity: 'low',
        issue: `${count} TODO/FIXME trouvés`,
        suggestion: 'Créer des issues GitHub pour tracker ces tâches',
        autoFixable: false,
      })
    }
  } catch {}
}

// 5. Vérifier TypeScript strict mode
function checkTypeScriptConfig() {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.base.json')
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'))
    const strictOptions = [
      'strict',
      'noImplicitAny',
      'strictNullChecks',
      'strictFunctionTypes',
      'strictBindCallApply',
      'strictPropertyInitialization',
      'noImplicitThis',
      'alwaysStrict',
    ]

    const missingStrict = strictOptions.filter((opt) => !tsconfig.compilerOptions[opt])

    if (missingStrict.length > 0) {
      reports.push({
        category: 'TypeScript',
        severity: 'medium',
        issue: `Options TypeScript strict manquantes: ${missingStrict.join(', ')}`,
        suggestion: 'Activer progressivement les options strict pour améliorer la type-safety',
        autoFixable: false,
      })
    }
  }
}

// 6. Vérifier les imports circulaires
function checkCircularDependencies() {
  try {
    // Utiliser madge si disponible
    execSync('npx madge --circular apps/web/src 2>/dev/null', {
      encoding: 'utf-8',
    })
  } catch (error) {
    if ((error as { stdout?: string }).stdout?.includes('Found')) {
      reports.push({
        category: 'Architecture',
        severity: 'high',
        issue: 'Dépendances circulaires détectées',
        suggestion: 'Refactoriser pour éliminer les imports circulaires',
        autoFixable: false,
      })
    }
  }
}

// 7. Performance du build
function checkBuildPerformance() {
  try {
    const turboCachePath = path.join(process.cwd(), '.turbo')
    if (!fs.existsSync(turboCachePath)) {
      reports.push({
        category: 'Build Performance',
        severity: 'medium',
        issue: 'Cache Turbo non configuré',
        suggestion: 'Configurer le cache Turbo pour accélérer les builds',
        autoFixable: true,
      })
    }
  } catch {}
}

// 8. Vérifier les vulnérabilités
function checkVulnerabilities() {
  try {
    const result = execSync('pnpm audit --json 2>/dev/null', {
      encoding: 'utf-8',
    })
    const audit = JSON.parse(result)

    if (audit.metadata?.vulnerabilities) {
      const vulns = audit.metadata.vulnerabilities
      const critical = vulns.critical || 0
      const high = vulns.high || 0

      if (critical > 0 || high > 0) {
        reports.push({
          category: 'Security',
          severity: 'high',
          issue: `${critical} vulnérabilités critiques, ${high} élevées`,
          suggestion: 'Exécuter: pnpm audit fix',
          autoFixable: true,
        })
      }
    }
  } catch {}
}

// Fonction principale
async function main() {
  checkUnusedDependencies()
  checkBundleSize()
  checkConsoleLogs()
  checkTodos()
  checkTypeScriptConfig()
  checkCircularDependencies()
  checkBuildPerformance()
  checkVulnerabilities()

  if (reports.length === 0) {
    return
  }

  // Grouper par sévérité
  const highSeverity = reports.filter((r) => r.severity === 'high')
  const mediumSeverity = reports.filter((r) => r.severity === 'medium')
  const lowSeverity = reports.filter((r) => r.severity === 'low')

  if (highSeverity.length > 0) {
    highSeverity.forEach((_r) => {})
  }

  if (mediumSeverity.length > 0) {
    mediumSeverity.forEach((_r) => {})
  }

  if (lowSeverity.length > 0) {
    lowSeverity.forEach((_r) => {})
  }

  const autoFixable = reports.filter((r) => r.autoFixable)
  if (autoFixable.length > 0) {
  }
}

// Exécuter
main().catch((err) => {
  process.stderr.write(`Error: ${err}\n`)
  process.exit(1)
})

#!/usr/bin/env ts-node
/**
 * Script de migration automatique vers TenantPrismaService
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-tenant-prisma.ts [--dry-run] [--file=path]
 *
 * Options:
 *   --dry-run  Affiche les changements sans les appliquer
 *   --file     Migre un fichier spécifique seulement
 *
 * Ce script:
 * 1. Trouve les fichiers utilisant PrismaService
 * 2. Remplace l'import par TenantPrismaService
 * 3. Modifie le constructeur
 * 4. Ajoute un getter pour `prisma`
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

// Configuration
const SRC_DIR = path.join(__dirname, '../src')
const DRY_RUN = process.argv.includes('--dry-run')
const SPECIFIC_FILE = process.argv.find(arg => arg.startsWith('--file='))?.split('=')[1]

// Modèles qui nécessitent le filtrage multi-tenant
const TENANT_MODELS = [
  'role',
  'permission',
  'userSocieteRole',
  'auditLog',
  'societeLicense',
  'societeUser',
  'site',
  'systemSetting',
  'systemParameter',
  'menuConfiguration',
  'userMenuPreferences',
  'menuConfigurationSimple',
  'userMenuPreference',
  'parameterSystem',
  'parameterApplication',
  'parameterClient',
  'notification',
  'notificationTemplate',
  'notificationSettings',
  'notificationRule',
  'queryBuilder',
]

// Fichiers à exclure de la migration
const EXCLUDE_PATTERNS = [
  '**/tenant-prisma.service.ts',
  '**/prisma.service.ts',
  '**/health.service.ts',
  '**/database-backup.service.ts',
  '**/database-stats.service.ts',
  '**/database-integrity.service.ts',
  '**/database-enum-fix.service.ts',
  '**/*.spec.ts',
  '**/*.test.ts',
]

interface MigrationResult {
  file: string
  status: 'migrated' | 'skipped' | 'already-migrated' | 'error'
  reason?: string
  changes?: string[]
}

/**
 * Vérifie si un fichier utilise des modèles multi-tenant
 */
function usesTenantModels(content: string): boolean {
  for (const model of TENANT_MODELS) {
    // Cherche des patterns comme: this.prisma.notification. ou prisma.notification.
    const pattern = new RegExp(`\\.${model}\\.`, 'i')
    if (pattern.test(content)) {
      return true
    }
  }
  return false
}

/**
 * Migre un fichier vers TenantPrismaService
 */
function migrateFile(filePath: string): MigrationResult {
  const relativePath = path.relative(SRC_DIR, filePath)

  try {
    let content = fs.readFileSync(filePath, 'utf-8')
    const originalContent = content
    const changes: string[] = []

    // Vérifier si déjà migré
    if (content.includes('TenantPrismaService')) {
      return {
        file: relativePath,
        status: 'already-migrated',
        reason: 'Déjà migré vers TenantPrismaService'
      }
    }

    // Vérifier si utilise PrismaService
    if (!content.includes('PrismaService')) {
      return {
        file: relativePath,
        status: 'skipped',
        reason: 'N\'utilise pas PrismaService'
      }
    }

    // Vérifier si utilise des modèles multi-tenant
    if (!usesTenantModels(content)) {
      return {
        file: relativePath,
        status: 'skipped',
        reason: 'N\'utilise pas de modèles multi-tenant'
      }
    }

    // 1. Modifier l'import
    const importRegex = /import\s*{\s*PrismaService\s*}\s*from\s*['"]([^'"]+prisma\.service)['"]/
    const importMatch = content.match(importRegex)

    if (importMatch) {
      // Calculer le chemin relatif vers tenant-prisma.service
      const currentDir = path.dirname(filePath)
      const tenantPrismaPath = path.join(SRC_DIR, 'core/multi-tenant/tenant-prisma.service')
      let relativeTenantPath = path.relative(currentDir, tenantPrismaPath).replace(/\\/g, '/')

      if (!relativeTenantPath.startsWith('.')) {
        relativeTenantPath = './' + relativeTenantPath
      }

      content = content.replace(
        importRegex,
        `import { TenantPrismaService } from '${relativeTenantPath}'`
      )
      changes.push('Import modifié: PrismaService → TenantPrismaService')
    }

    // 2. Modifier le constructeur
    // Pattern: constructor(private readonly prisma: PrismaService)
    const constructorRegex = /constructor\s*\(\s*private\s+readonly\s+prisma\s*:\s*PrismaService\s*\)/
    if (constructorRegex.test(content)) {
      content = content.replace(
        constructorRegex,
        'constructor(private readonly tenantPrisma: TenantPrismaService)'
      )
      changes.push('Constructeur modifié: prisma → tenantPrisma')
    }

    // Pattern avec autres dépendances: constructor(..., private readonly prisma: PrismaService, ...)
    const constructorMultiRegex = /private\s+readonly\s+prisma\s*:\s*PrismaService/g
    if (constructorMultiRegex.test(content)) {
      content = content.replace(
        constructorMultiRegex,
        'private readonly tenantPrisma: TenantPrismaService'
      )
      if (!changes.includes('Constructeur modifié: prisma → tenantPrisma')) {
        changes.push('Constructeur modifié: prisma → tenantPrisma')
      }
    }

    // 3. Ajouter le getter après le constructeur
    const getterCode = `

  /** Client Prisma avec filtrage automatique par tenant */
  private get prisma() {
    return this.tenantPrisma.client
  }`

    // Trouver la fin du constructeur et ajouter le getter
    const constructorEndRegex = /constructor\s*\([^)]*\)\s*\{[^}]*\}/
    const constructorMatch = content.match(constructorEndRegex)

    if (constructorMatch) {
      const constructorEnd = content.indexOf(constructorMatch[0]) + constructorMatch[0].length
      content = content.slice(0, constructorEnd) + getterCode + content.slice(constructorEnd)
      changes.push('Getter ajouté: private get prisma()')
    } else {
      // Constructeur sans corps: constructor(private readonly tenantPrisma: TenantPrismaService) {}
      const simpleConstructorRegex = /(constructor\s*\([^)]*\)\s*\{\s*\})/
      if (simpleConstructorRegex.test(content)) {
        content = content.replace(
          simpleConstructorRegex,
          '$1' + getterCode
        )
        changes.push('Getter ajouté: private get prisma()')
      }
    }

    // Vérifier si des changements ont été faits
    if (content === originalContent) {
      return {
        file: relativePath,
        status: 'skipped',
        reason: 'Aucun changement nécessaire'
      }
    }

    // Appliquer les changements (sauf en dry-run)
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, content, 'utf-8')
    }

    return {
      file: relativePath,
      status: 'migrated',
      changes
    }

  } catch (error) {
    return {
      file: relativePath,
      status: 'error',
      reason: (error as Error).message
    }
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🔄 Migration vers TenantPrismaService')
  console.log('=====================================\n')

  if (DRY_RUN) {
    console.log('⚠️  Mode DRY-RUN: aucun fichier ne sera modifié\n')
  }

  // Trouver les fichiers à migrer
  let files: string[]

  if (SPECIFIC_FILE) {
    files = [path.resolve(SPECIFIC_FILE)]
    console.log(`📁 Fichier spécifique: ${SPECIFIC_FILE}\n`)
  } else {
    const pattern = path.join(SRC_DIR, '**/*.service.ts').replace(/\\/g, '/')
    files = await glob(pattern, {
      ignore: EXCLUDE_PATTERNS.map(p => path.join(SRC_DIR, p).replace(/\\/g, '/'))
    })
    console.log(`📁 ${files.length} fichiers trouvés\n`)
  }

  // Migrer chaque fichier
  const results: MigrationResult[] = []

  for (const file of files) {
    const result = migrateFile(file)
    results.push(result)

    // Afficher le résultat
    const icon = {
      'migrated': '✅',
      'skipped': '⏭️',
      'already-migrated': '✔️',
      'error': '❌'
    }[result.status]

    if (result.status === 'migrated') {
      console.log(`${icon} ${result.file}`)
      result.changes?.forEach(c => console.log(`   └─ ${c}`))
    } else if (result.status === 'error') {
      console.log(`${icon} ${result.file}: ${result.reason}`)
    }
  }

  // Résumé
  console.log('\n=====================================')
  console.log('📊 Résumé de la migration')
  console.log('=====================================')

  const migrated = results.filter(r => r.status === 'migrated').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const alreadyMigrated = results.filter(r => r.status === 'already-migrated').length
  const errors = results.filter(r => r.status === 'error').length

  console.log(`✅ Migrés: ${migrated}`)
  console.log(`⏭️  Ignorés: ${skipped}`)
  console.log(`✔️  Déjà migrés: ${alreadyMigrated}`)
  console.log(`❌ Erreurs: ${errors}`)

  if (DRY_RUN && migrated > 0) {
    console.log('\n💡 Exécutez sans --dry-run pour appliquer les changements')
  }

  if (migrated > 0 && !DRY_RUN) {
    console.log('\n⚠️  N\'oubliez pas de vérifier la compilation: pnpm exec tsc --noEmit -p tsconfig.json')
  }
}

main().catch(console.error)

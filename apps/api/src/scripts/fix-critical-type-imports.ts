import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Liste des fichiers critiques qui causent des erreurs au démarrage
const criticalFiles = [
  'features/marketplace/services/marketplace.service.ts',
  'domains/auth/auth.service.ts',
  'domains/auth/auth.controller.ts',
  'domains/auth/services/mfa.service.ts',
  'domains/auth/services/user-societe-roles.service.ts',
  'domains/auth/security/strategies/local.strategy.ts',
  'domains/users/users.controller.ts',
  'core/database/config/multi-tenant-database.config.ts',
  'features/admin/admin.controller.ts',
  'features/admin/services/menu-raw.service.ts',
  'features/admin/services/admin-dashboard.service.ts',
  'features/admin/services/admin-roles.service.ts',
  'features/admin/services/admin-elasticsearch.service.ts',
  'features/parameters/services/parameter.service.ts',
  'features/shared/shared.controller.ts',
  'core/health/system-health-simple.service.ts',
  'core/health/integrity.service.ts',
  'core/services/database-startup.service.ts',
]

function fixTypeImports(filePath: string) {
  const fullPath = join(__dirname, '..', filePath)

  try {
    let content = readFileSync(fullPath, 'utf-8')
    const originalContent = content

    // Remplacer les imports type de services/providers
    content = content.replace(/import type \{ ([^}]+Service[^}]*) \} from/g, 'import { $1 } from')

    content = content.replace(
      /import type \{ ([^}]+Repository[^}]*) \} from/g,
      'import { $1 } from'
    )

    content = content.replace(/import type \{ ([^}]+Provider[^}]*) \} from/g, 'import { $1 } from')

    // Cas spéciaux pour NestJS
    content = content.replace(
      /import type \{ (ConfigService|JwtService) \} from/g,
      'import { $1 } from'
    )

    if (content !== originalContent) {
      writeFileSync(fullPath, content)
      console.log(`✅ Fixed: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error)
  }
}

console.log('Fixing critical type imports...\n')

criticalFiles.forEach((file) => {
  fixTypeImports(file)
})

console.log('\n✅ Critical imports fixed!')
console.log('Note: There may be more type imports to fix, but these are the most critical ones.')

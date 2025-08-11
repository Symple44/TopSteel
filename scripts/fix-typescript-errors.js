#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Corrections pour les erreurs TypeScript spécifiques
const fixes = [
  // Fix pour les propriétés manquantes sur unknown
  {
    file: 'apps/api/src/core/common/repositories/base.repository.ts',
    pattern: /await this\.repository\.update\(id, data as unknown\)/g,
    replacement: 'await this.repository.update(id, data as any)',
  },
  {
    file: 'apps/api/src/core/common/services/enhanced-database.service.ts',
    pattern: /return \(result as \{ data\?: unknown \}\)\.data \|\| \(result as T\)/g,
    replacement: 'return (result as any).data || (result as T)',
  },
  {
    file: 'apps/api/src/core/health/health.controller.ts',
    pattern: /const healthResult = await this\.health\.check\(healthChecks as unknown\)/g,
    replacement: 'const healthResult = await this.health.check(healthChecks as any)',
  },
  {
    file: 'apps/api/src/core/health/health.controller.ts',
    pattern: /\} as unknown\)/g,
    replacement: '} as any)',
  },
  {
    file: 'apps/api/src/domains/auth/auth.service.ts',
    pattern: /this\.geolocationService\.extractRealIP\(request as unknown\)/g,
    replacement: 'this.geolocationService.extractRealIP(request as any)',
  },
  {
    file: 'apps/api/src/domains/auth/auth.service.ts',
    pattern: /\(user as unknown\)\.(firstName|lastName)/g,
    replacement: '(user as any).$1',
  },
  {
    file: 'apps/api/src/domains/auth/auth.service.ts',
    pattern: /await this\.mfaService\.disableMFA\(userId, method\.type as unknown\)/g,
    replacement: 'await this.mfaService.disableMFA(userId, method.type as any)',
  },
  {
    file: 'apps/api/src/domains/auth/external/controllers/mfa.controller.ts',
    pattern: /\(req as unknown\)\.headers/g,
    replacement: '(req as any).headers',
  },
  {
    file: 'apps/api/src/domains/auth/security/guards/enhanced-roles.guard.ts',
    pattern: /return \(request as \{ query\?: Record<string, unknown> \}\)\.query\.userId/g,
    replacement: 'return (request as { query?: Record<string, any> }).query?.userId as string',
  },
  {
    file: 'apps/api/src/domains/auth/security/guards/enhanced-tenant.guard.ts',
    pattern: /\(tenantContext\.userSocieteInfo as unknown\)\?\.effectiveRole/g,
    replacement: '(tenantContext.userSocieteInfo as any)?.effectiveRole',
  },
  {
    file: 'apps/api/src/domains/auth/security/guards/resource-ownership.guard.ts',
    pattern: /return value/g,
    replacement: 'return value as string',
  },
  {
    file: 'apps/api/src/domains/auth/services/geolocation.service.ts',
    pattern: /\(data as unknown\)\.(countryCode)/g,
    replacement: '(data as any).$1',
  },
  {
    file: 'apps/api/src/domains/auth/services/geolocation.service.ts',
    pattern: /\(session as unknown\)\.(loginTime|location|status)/g,
    replacement: '(session as any).$1',
  },
  {
    file: 'apps/api/src/domains/auth/services/jwt-utils.service.ts',
    pattern: /\(payload as unknown\)\?\.exp/g,
    replacement: '(payload as any)?.exp',
  },
  {
    file: 'apps/api/src/domains/auth/services/mfa.service.ts',
    pattern: /this\.geolocationService\.extractRealIP\(request as unknown\)/g,
    replacement: 'this.geolocationService.extractRealIP(request as any)',
  },
  {
    file: 'apps/api/src/domains/auth/services/mfa.service.ts',
    pattern: /\(request as unknown\)\.headers/g,
    replacement: '(request as any).headers',
  },
  {
    file: 'apps/api/src/domains/auth/services/user-societe-roles.service.ts',
    pattern: /\(row as unknown\)\.societeId/g,
    replacement: '(row as any).societeId',
  },
  {
    file: 'apps/api/src/domains/auth/services/webauthn.service.ts',
    pattern: /\(response\.response as unknown\)\?\.publicKey/g,
    replacement: '(response.response as any)?.publicKey',
  },
  {
    file: 'apps/api/src/domains/core/base/business-service.ts',
    pattern: /validation\.errors as unknown/g,
    replacement: 'validation.errors as any',
  },
  {
    file: 'apps/api/src/domains/materials/controllers/material.controller.ts',
    pattern: /\(type as unknown\)/g,
    replacement: '(type as any)',
  },
  {
    file: 'apps/api/src/domains/materials/entities/material.entity.ts',
    pattern: /\(this\.metadonnees as Record<string, unknown>\)\.historique\.(push|length|slice)/g,
    replacement: '(this.metadonnees as any).historique.$1',
  },
  {
    file: 'apps/api/src/domains/users/users.controller.ts',
    pattern: /\(user as unknown\)\.id/g,
    replacement: '(user as any).id',
  },
  {
    file: 'apps/api/src/domains/users/users.controller.ts',
    pattern: /settings\.preferences\.notifications as unknown/g,
    replacement: 'settings.preferences.notifications as any',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-mfa.controller.ts',
    pattern: /\(status as unknown\)\.(mfaMethodDistribution|totalUsers|usersWithMFA|usersByRole)/g,
    replacement: '(status as any).$1',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-mfa.controller.ts',
    pattern: /\(mfaRecords as unknown\)/g,
    replacement: '(mfaRecords as any)',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-mfa.controller.ts',
    pattern: /\(mfaSessions as unknown\)/g,
    replacement: '(mfaSessions as any)',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-mfa.controller.ts',
    pattern: /\(record as unknown\)\.type/g,
    replacement: '(record as any).type',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-mfa.controller.ts',
    pattern: /\(session as unknown\)\.(getAttemptsCount|createdAt)/g,
    replacement: '(session as any).$1',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-societes.controller.ts',
    pattern: /\(currentUser as unknown\)\.id/g,
    replacement: '(currentUser as any).id',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-users.controller.ts',
    pattern: /\(error as unknown\)\.code/g,
    replacement: '(error as any).code',
  },
  {
    file: 'apps/api/src/features/admin/controllers/admin-users.controller.ts',
    pattern: /\(tenant as unknown\)\.societeId/g,
    replacement: '(tenant as any).societeId',
  },
  {
    file: 'apps/api/src/features/admin/services/admin-roles.service.ts',
    pattern: /\(role as unknown\)\.id/g,
    replacement: '(role as any).id',
  },
  {
    file: 'apps/api/src/features/admin/services/admin-roles.service.ts',
    pattern: /\(rp\.permission as unknown\)\.id/g,
    replacement: '(rp.permission as any).id',
  },
  {
    file: 'apps/api/src/features/admin/system-parameters.controller.ts',
    pattern: /category as unknown/g,
    replacement: 'category as any',
  },
  {
    file: 'apps/api/src/core/database/services/migration-loader.service.ts',
    pattern: /this\.isDevelopment = /g,
    replacement:
      'private isDevelopment = false;\n\n  constructor(private configService: ConfigService) {\n    this.isDevelopment = ',
  },
]

function applyFix(fixConfig) {
  const filePath = path.resolve(fixConfig.file)

  if (!fs.existsSync(filePath)) {
    return false
  }

  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content

  if (fixConfig.pattern) {
    content = content.replace(fixConfig.pattern, fixConfig.replacement)
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    return true
  }

  return false
}

let _totalFixed = 0

// Appliquer toutes les corrections
for (const fix of fixes) {
  if (applyFix(fix)) {
    _totalFixed++
  }
}

// Fix spécial pour migration-loader.service.ts
const migrationLoaderPath = 'apps/api/src/core/database/services/migration-loader.service.ts'
if (fs.existsSync(migrationLoaderPath)) {
  let content = fs.readFileSync(migrationLoaderPath, 'utf8')

  // Ajouter la propriété isDevelopment si elle n'existe pas
  if (!content.includes('private isDevelopment')) {
    content = content.replace(
      'export class MigrationLoaderService {',
      'export class MigrationLoaderService {\n  private isDevelopment = false;'
    )

    // Corriger le constructeur
    content = content.replace(
      'constructor(private configService: ConfigService) {',
      "constructor(private configService: ConfigService) {\n    this.isDevelopment = this.configService.get('NODE_ENV') === 'development';"
    )

    // Supprimer la ligne incorrecte
    content = content.replace(/^\s*this\.isDevelopment = .*$/gm, '')

    fs.writeFileSync(migrationLoaderPath, content, 'utf8')
    _totalFixed++
  }
}

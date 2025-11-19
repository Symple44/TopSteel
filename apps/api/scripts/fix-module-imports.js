#!/usr/bin/env node

/**
 * Fixe les imports Prisma dans les modules TypeORM
 * Les modules utilisant TypeOrmModule.forFeature([...]) nécessitent des CLASSES,
 * pas des interfaces Prisma
 *
 * Usage: node apps/api/scripts/fix-module-imports.js
 */

const fs = require('fs');
const path = require('path');

// Mapping: Prisma type → TypeORM entity path
const entityMappings = {
  // Auth domain
  User: "../../domains/users/entities/user.entity",
  UserSession: "../../domains/auth/core/entities/user-session.entity",
  MfaSession: "../../domains/auth/core/entities/mfa-session.entity",
  MFASession: "../../domains/auth/core/entities/mfa-session.entity",
  UserMfa: "../../domains/auth/core/entities/user-mfa.entity",
  UserMFA: "../../domains/auth/core/entities/user-mfa.entity",
  Role: "../../domains/auth/core/entities/role.entity",
  Permission: "../../domains/auth/core/entities/permission.entity",
  RolePermission: "../../domains/auth/core/entities/role-permission.entity",
  UserRole: "../../domains/auth/core/entities/user-role.entity",
  Group: "../../domains/auth/core/entities/group.entity",
  UserGroup: "../../domains/auth/core/entities/user-group.entity",
  UserSocieteRole: "../../domains/auth/core/entities/user-societe-role.entity",
  Module: "../../domains/auth/core/entities/module.entity",
  AuditLog: "../../domains/auth/core/entities/audit-log.entity",
  SmsLog: "../../domains/auth/entities/sms-log.entity",

  // Admin/Menu domain
  MenuConfiguration: "../../domains/admin/entities/menu-configuration.entity",
  MenuItem: "../../domains/admin/entities/menu-item.entity",
  UserMenuPreference: "../../domains/admin/entities/user-menu-preference.entity",

  // Admin/Menu features
  MenuItemRole: "../../features/admin/entities/menu-item-role.entity",
  MenuItemPermission: "../../features/admin/entities/menu-item-permission.entity",
  UserMenuItemPreference: "../../features/admin/entities/user-menu-item-preference.entity",
  UserMenuPreferences: "../../features/admin/entities/user-menu-preferences.entity",
  MenuConfigurationSimple: "../../features/admin/entities/menu-configuration-simple.entity",
  SystemParameter: "../../features/admin/entitites/system-parameter.entity",
  SystemSetting: "../../features/admin/entitites/system-setting.entity",
  DiscoveredPage: "../../features/menu/entities/discovered-page.entity",

  // User domain
  UserSettings: "../../domains/users/entities/user-settings.entity",

  // Notification domain
  NotificationRule: "../../domains/notifications/entities/notification-rule.entity",
  NotificationSettings: "../../features/notifications/entities/notification-settings.entity",

  // Parameters
  ParameterApplication: "../../features/parameters/entities/parameter-application.entity",
  ParameterClient: "../../features/parameters/entities/parameter-client.entity",
  ParameterSystem: "../../features/parameters/entities/parameter-system.entity",

  // Societes
  Societe: "../../features/societes/entities/societe.entity",
  SocieteUser: "../../features/societes/entities/societe-user.entity",
  SocieteLicense: "../../features/societes/entities/societe-license.entity",
  Site: "../../features/societes/entities/site.entity",
};

const stats = {
  filesProcessed: 0,
  filesModified: 0,
  importsReplaced: 0,
};

/**
 * Fixe un fichier module
 */
function fixModuleFile(filePath) {
  stats.filesProcessed++;
  const content = fs.readFileSync(filePath, 'utf-8');
  const relativePath = path.relative(path.join(__dirname, '../src'), filePath);

  // Trouver l'import Prisma
  const prismaImportPattern = /import\s+{([^}]+)}\s+from\s+['"]@prisma\/client['"]/g;
  const match = prismaImportPattern.exec(content);

  if (!match) {
    return; // Pas d'import Prisma
  }

  const prismaTypes = match[1]
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);

  console.log(`\n📝 ${relativePath}`);
  console.log(`  Found ${prismaTypes.length} Prisma imports: ${prismaTypes.join(', ')}`);

  // Calculer la profondeur du fichier pour ajuster les imports relatifs
  const depth = relativePath.split(path.sep).length - 1;

  // Créer les imports TypeORM
  const typeormImports = [];
  const unmappedTypes = [];

  for (const type of prismaTypes) {
    const entityPath = entityMappings[type];
    if (entityPath) {
      // Ajuster le chemin relatif selon la profondeur
      const adjustedPath = entityPath.replace(/\.\.\//g, (match, offset, string) => {
        // Compter les "../" dans le mapping et ajuster
        return '../'.repeat(depth);
      });

      // Simplifier: utiliser le chemin du mapping tel quel car il est déjà relatif
      typeormImports.push({
        type: type,
        path: entityPath,
      });
    } else {
      unmappedTypes.push(type);
    }
  }

  if (unmappedTypes.length > 0) {
    console.log(`  ⚠️  Unmapped types: ${unmappedTypes.join(', ')}`);
  }

  // Grouper imports par path
  const importsByPath = {};
  for (const imp of typeormImports) {
    if (!importsByPath[imp.path]) {
      importsByPath[imp.path] = [];
    }
    importsByPath[imp.path].push(imp.type);
  }

  // Générer les lignes d'import TypeORM
  const typeormImportLines = Object.entries(importsByPath)
    .map(([path, types]) => {
      return `import { ${types.join(', ')} } from '${path}'`;
    })
    .join('\n');

  // Remplacer l'import Prisma par les imports TypeORM
  let newContent = content.replace(match[0], typeormImportLines);

  // Nettoyer lignes blanches multiples
  newContent = newContent.replace(/\n\n\n+/g, '\n\n');

  // Écrire si modifié
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    stats.filesModified++;
    stats.importsReplaced += typeormImports.length;
    console.log(`  ✅ Replaced ${typeormImports.length} imports with TypeORM entities`);
  }
}

/**
 * Main
 */
function main() {
  console.log('🚀 Fixing module imports (Prisma → TypeORM)...\n');

  // Liste des fichiers module à corriger
  const moduleFiles = [
    'core/database/database.module.ts',
    'domains/auth/auth.module.ts',
    'domains/auth/role-auth.module.ts',
    'domains/users/users.module.ts',
    'features/admin/admin.module.ts',
    'features/admin/menu-sync.module.ts',
    'features/database-core/database-core.module.ts',
    'features/menu/menu.module.ts',
    'features/parameters/parameters.module.ts',
    'features/query-builder/query-builder.module.ts',
    'features/societes/societes.module.ts',
  ];

  const srcDir = path.join(__dirname, '../src');

  for (const modulePath of moduleFiles) {
    const fullPath = path.join(srcDir, modulePath);
    if (fs.existsSync(fullPath)) {
      fixModuleFile(fullPath);
    } else {
      console.log(`⚠️  File not found: ${modulePath}`);
    }
  }

  // Rapport final
  console.log('\n' + '='.repeat(80));
  console.log('📊 MODULE IMPORTS FIX REPORT');
  console.log('='.repeat(80));
  console.log(`\n  ✓ Files processed: ${stats.filesProcessed}`);
  console.log(`  ✓ Files modified: ${stats.filesModified}`);
  console.log(`  ✓ Imports replaced: ${stats.importsReplaced}`);
  console.log('\n' + '='.repeat(80));
  console.log('Next step: Validate compilation');
  console.log('  npx tsc --noEmit');
  console.log('='.repeat(80) + '\n');
}

// Exécuter
main();

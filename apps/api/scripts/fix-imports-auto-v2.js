/**
 * Script to automatically fix TypeORM entity imports - Version 2
 * Now handles relative path imports like ../entities/*.entity
 * Replaces with Prisma Client types
 */

const fs = require('fs');
const path = require('path');

// Mapping of deleted TypeORM entities to Prisma types
const entityToPrismaMap = {
  // Auth
  'user.entity': 'User',
  'role.entity': 'Role',
  'permission.entity': 'Permission',
  'user-role.entity': 'UserRole',
  'role-permission.entity': 'RolePermission',
  'user-session.entity': 'UserSession',
  'user-mfa.entity': 'UserMfa',
  'mfa-session.entity': 'MfaSession',
  'user-group.entity': 'UserGroup',
  'group.entity': 'Group',
  'user-societe-role.entity': 'UserSocieteRole',
  'audit-log.entity': 'AuditLog',
  'sms-log.entity': 'SmsLog',
  'module.entity': 'Module',
  'user-settings.entity': 'UserSettings',

  // Menu/Admin
  'menu-configuration.entity': 'MenuConfiguration',
  'menu-item.entity': 'MenuItem',
  'menu-item-permission.entity': 'MenuItemPermission',
  'menu-item-role.entity': 'MenuItemRole',
  'user-menu-preference.entity': 'UserMenuPreference',
  'user-menu-preferences.entity': 'UserMenuPreferences',
  'user-menu-item-preference.entity': 'UserMenuItemPreference',
  'menu-configuration-simple.entity': 'MenuConfigurationSimple',
  'discovered-page.entity': 'DiscoveredPage',
  'system-parameter.entity': 'SystemParameter',
  'system-setting.entity': 'SystemSetting',

  // Notifications
  'notification-event.entity': 'NotificationEvent',
  'notification-read.entity': 'NotificationRead',
  'notification-rule.entity': 'NotificationRule',
  'notification-rule-execution.entity': 'NotificationRuleExecution',
  'notification-settings.entity': 'NotificationSettings',
  'notification-template.entity': 'NotificationTemplate',

  // Societes
  'societe.entity': 'Societe',
  'site.entity': 'Site',
  'societe-user.entity': 'SocieteUser',
  'societe-license.entity': 'SocieteLicense',

  // Parameters
  'parameter-system.entity': 'ParameterSystem',
  'parameter-application.entity': 'ParameterApplication',
  'parameter-client.entity': 'ParameterClient',

  // Query Builder
  'query-builder.entity': 'QueryBuilder',
  'query-builder-column.entity': 'QueryBuilderColumn',
  'query-builder-join.entity': 'QueryBuilderJoin',
  'query-builder-calculated-field.entity': 'QueryBuilderCalculatedField',
  'query-builder-permission.entity': 'QueryBuilderPermission',
};

function fixFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`   ⚠️  File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  let modified = false;
  const types = new Set();

  // Pattern 1: Absolute paths - from '@/domains/.../entities/x.entity'
  const absoluteRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([@\w\/.-]+\/entities\/[^'"]+\.entity(?:\.ts)?)['"];?\n?/g;

  // Pattern 2: Relative paths - from '../entities/x.entity' or '../../domains/.../entities/x.entity'
  const relativeRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"](\.\.\/?[^'"]*\/entities\/[^'"]+\.entity(?:\.ts)?)['"];?\n?/g;

  // Pattern 3: Direct entity imports - from 'x.entity'
  const directRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([\w-]+\.entity(?:\.ts)?)['"];?\n?/g;

  let match;
  const linesToRemove = [];

  // Find all entity imports (Pattern 1: Absolute)
  while ((match = absoluteRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, defaultImport, importPath] = match;
    const entityFile = path.basename(importPath).replace('.ts', '');

    if (entityToPrismaMap[entityFile]) {
      const prismaType = entityToPrismaMap[entityFile];
      types.add(prismaType);
      linesToRemove.push(fullMatch);
      modified = true;
    }
  }

  // Find all entity imports (Pattern 2: Relative)
  while ((match = relativeRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, defaultImport, importPath] = match;
    const entityFile = path.basename(importPath).replace('.ts', '');

    if (entityToPrismaMap[entityFile]) {
      const prismaType = entityToPrismaMap[entityFile];
      types.add(prismaType);
      linesToRemove.push(fullMatch);
      modified = true;
    }
  }

  // Find all entity imports (Pattern 3: Direct)
  while ((match = directRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, defaultImport, importPath] = match;
    const entityFile = importPath.replace('.ts', '');

    if (entityToPrismaMap[entityFile]) {
      const prismaType = entityToPrismaMap[entityFile];
      types.add(prismaType);
      linesToRemove.push(fullMatch);
      modified = true;
    }
  }

  // Remove all matched import lines
  for (const line of linesToRemove) {
    content = content.replace(line, '');
  }

  // If we found types to replace, add Prisma import
  if (types.size > 0) {
    const prismaTypes = Array.from(types).sort().join(', ');
    const prismaImport = `import { ${prismaTypes} } from '@prisma/client'\n`;

    // Check if Prisma import already exists
    const hasPrismaImport = /import\s+{[^}]*}\s+from\s+['"]@prisma\/client['"]/.test(content);

    if (hasPrismaImport) {
      // Merge with existing Prisma import
      content = content.replace(
        /import\s+{([^}]*)}\s+from\s+['"]@prisma\/client['"]/,
        (match, existingTypes) => {
          const existing = existingTypes.split(',').map(t => t.trim()).filter(Boolean);
          const allTypes = [...new Set([...existing, ...Array.from(types)])].sort();
          return `import { ${allTypes.join(', ')} } from '@prisma/client'`;
        }
      );
    } else {
      // Find the last import statement
      const lastImportMatch = content.match(/import[^;]+;?\n(?!import)/);
      if (lastImportMatch) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        content = content.slice(0, insertPos) + prismaImport + content.slice(insertPos);
      } else {
        // No imports found, add at the beginning
        content = prismaImport + content;
      }
    }

    // Clean up multiple consecutive blank lines
    content = content.replace(/\n{3,}/g, '\n\n');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ ${filePath} (${types.size} types)`);
    return true;
  }

  return false;
}

// Get all TypeScript files with import errors
function getAllTsFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        getAllTsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts') && !file.endsWith('.spec.ts')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

// Main execution
console.log('\n🔧 Auto-fixing TypeORM imports (V2 - with relative paths)...\n');

const srcDir = path.join(__dirname, '../src');
const allFiles = getAllTsFiles(srcDir);

console.log(`📁 Found ${allFiles.length} TypeScript files\n`);

let fixed = 0;
let failed = 0;
let skipped = 0;

for (const fullPath of allFiles) {
  const relativePath = path.relative(path.join(__dirname, '..'), fullPath);

  try {
    if (fixFile(relativePath)) {
      fixed++;
    } else {
      skipped++;
    }
  } catch (error) {
    console.log(`   ❌ ${relativePath}: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   ⏭️  Skipped: ${skipped} files (no entity imports)`);
console.log(`   ❌ Failed: ${failed} files`);
console.log(`   📁 Total: ${allFiles.length} files\n`);

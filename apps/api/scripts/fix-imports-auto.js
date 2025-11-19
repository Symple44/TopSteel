/**
 * Script to automatically fix TypeORM entity imports
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
  let modified = false;
  const types = new Set();

  // Find all entity imports
  const importRegex = /import\s+(?:{([^}]+)}|(\w+))\s+from\s+['"]([^'"]+\.entity(?:\.ts)?)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const [fullMatch, namedImports, defaultImport, importPath] = match;
    const entityFile = path.basename(importPath, '.ts');

    if (entityToPrismaMap[entityFile]) {
      // Get the Prisma type name
      const prismaType = entityToPrismaMap[entityFile];
      types.add(prismaType);

      // Remove this import line
      content = content.replace(fullMatch + '\n', '');
      modified = true;
    }
  }

  // If we found types to replace, add Prisma import
  if (types.size > 0) {
    const prismaTypes = Array.from(types).sort().join(', ');
    const prismaImport = `import { ${prismaTypes} } from '@prisma/client'\n`;

    // Find the last import statement
    const lastImportMatch = content.match(/import[^;]+;?\n(?!import)/);
    if (lastImportMatch) {
      const insertPos = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, insertPos) + prismaImport + content.slice(insertPos);
    } else {
      // No imports found, add at the beginning
      content = prismaImport + content;
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`   ✅ ${filePath} (${types.size} types)`);
    return true;
  }

  return false;
}

// Main execution
console.log('\n🔧 Auto-fixing TypeORM imports...\n');

const reportPath = path.join(__dirname, '../docs/IMPORT_FIX_PLAN.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));

const filesToFix = report.actionPlan.toUpdate;
let fixed = 0;
let failed = 0;

for (const file of filesToFix) {
  try {
    if (fixFile(file)) {
      fixed++;
    }
  } catch (error) {
    console.log(`   ❌ ${file}: ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Summary:`);
console.log(`   ✅ Fixed: ${fixed} files`);
console.log(`   ❌ Failed: ${failed} files`);
console.log(`   📁 Total: ${filesToFix.length} files\n`);

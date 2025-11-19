#!/bin/bash
# Script généré automatiquement par analyze-typeorm-usage.js
# Restaure les entities TypeORM critiques depuis le commit avant Phase 1

set -e

echo "🔄 Restauration des entities TypeORM critiques..."
echo ""

COMMIT_BEFORE_DELETION="f024017b~1"

echo "  ✓ Restoring src/domains/users/entities/user.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/users/entities/user.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/menu-item-role.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/menu-item-role.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/menu-item-permission.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/menu-item-permission.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/societes/entities/societe.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/societes/entities/societe.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/menu-item.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/menu-item.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/menu-configuration.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/menu-configuration.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/menu/entities/user-menu-preference.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/menu/entities/user-menu-preference.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/notifications/entities/notification-rule.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/notifications/entities/notification-rule.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/societes/entities/societe-user.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/societes/entities/societe-user.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/group.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/group.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/role-permission.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/role-permission.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/user-session.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/user-session.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/user-societe-role.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/user-societe-role.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/module.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/module.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/users/entities/user-settings.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/users/entities/user-settings.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/menu/entities/discovered-page.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/menu/entities/discovered-page.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/parameters/entities/parameter-application.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/parameters/entities/parameter-application.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/parameters/entities/parameter-client.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/parameters/entities/parameter-client.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/parameters/entities/parameter-system.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/parameters/entities/parameter-system.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/societes/entities/site.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/societes/entities/site.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/mfa-session.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/mfa-session.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/user-mfa.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/user-mfa.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/user-menu-item-preference.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/user-menu-item-preference.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/user-menu-preferences.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/user-menu-preferences.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/societes/entities/societe-license.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/societes/entities/societe-license.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/audit-log.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/audit-log.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/user-group.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/user-group.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/core/entities/user-role.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/core/entities/user-role.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/domains/auth/entities/sms-log.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/domains/auth/entities/sms-log.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/notifications/entities/notification-settings.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/notifications/entities/notification-settings.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"

echo "  ✓ Restoring src/features/admin/entities/menu-configuration-simple.entity.ts"
git checkout "$COMMIT_BEFORE_DELETION" -- "apps/api/src/features/admin/entities/menu-configuration-simple.entity.ts" 2>/dev/null || echo "    ⚠️  File not found in git history"


echo ""
echo "✅ Restauration terminée!"
echo ""
echo "Prochaine étape: Nettoyer les imports dupliqués"
echo "  → node apps/api/scripts/cleanup-duplicate-imports.js"

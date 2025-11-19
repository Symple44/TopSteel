#!/bin/bash
# Script to delete obsolete TypeORM config files

echo "🗑️  Deleting obsolete TypeORM files..."
echo ""

echo "Deleting: src/core/database/config/multi-tenant-database.config.ts"
rm "src/src/core/database/config/multi-tenant-database.config.ts"
echo "Deleting: src/core/database/database.config.simple.ts"
rm "src/src/core/database/database.config.simple.ts"
echo "Deleting: src/domains/auth/core/entities/index.ts"
rm "src/src/domains/auth/core/entities/index.ts"
echo "Deleting: src/features/menu/entities/index.ts"
rm "src/src/features/menu/entities/index.ts"
echo "Deleting: src/features/notifications/entities/index.ts"
rm "src/src/features/notifications/entities/index.ts"
echo "Deleting: src/features/query-builder/entities/index.ts"
rm "src/src/features/query-builder/entities/index.ts"

echo ""
echo "✅ Deletion complete!"
echo "   Deleted: 6 files"
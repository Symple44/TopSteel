import { Module } from '@nestjs/common'
// Administration
import { AdminModule } from './admin/admin.module'
import { MenuSyncModule } from './admin/menu-sync.module'
// Core features
import { DatabaseCoreModule } from './database-core/database-core.module'
import { MenuModule } from './menu/menu.module'
import { ParametersModule } from './parameters/parameters.module'; // Clean - uses pure Prisma
// Infrastructure features
import { NotificationsModule } from './notifications/notifications.module'; // Clean - uses pure Prisma
import { QueryBuilderModule } from './query-builder/query-builder.module'; // ✅ Migrated to Prisma
import { SearchModule } from './search/search.module'
import { SocietesModule } from './societes/societes.module'
import { UIPreferencesModule } from './ui-preferences/ui-preferences.module'; // Clean - uses pure Prisma

// Uncomment as needed:
// import { MarketplaceAppModule } from './marketplace/marketplace-app.module'

/**
 * Features Module
 *
 * Groups all feature modules together:
 * - Administration features
 * - UI preferences
 * - Pricing
 * - Search
 * - Query builder
 * - Multi-tenant features
 */
@Module({
  imports: [
    // Core database features
    DatabaseCoreModule,

    // Administration
    AdminModule,
    MenuSyncModule,
    MenuModule, // Clean - uses pure Prisma
    ParametersModule, // Clean - uses pure Prisma
    UIPreferencesModule, // Clean - uses pure Prisma

    // Multi-tenant
    SocietesModule,

    // Infrastructure features
    QueryBuilderModule, // ✅ Migrated to Prisma
    SearchModule, // Clean - uses pure Prisma
    NotificationsModule, // Clean - uses pure Prisma

    // Features to reactivate progressively:
    // MarketplaceAppModule,
  ],
  exports: [
    // Export all modules so they can be used by other modules
    DatabaseCoreModule,
    AdminModule,
    MenuSyncModule,
    MenuModule, // Clean - uses pure Prisma
    ParametersModule, // Clean - uses pure Prisma
    UIPreferencesModule, // Clean - uses pure Prisma
    SocietesModule,
    QueryBuilderModule, // ✅ Migrated to Prisma
    SearchModule, // Clean - uses pure Prisma
    NotificationsModule, // Clean - uses pure Prisma
  ],
})
export class FeaturesModule {}

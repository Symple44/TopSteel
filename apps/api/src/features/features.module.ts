import { Module } from '@nestjs/common'
// Administration
import { AdminModule } from './admin/admin.module'
import { MenuSyncModule } from './admin/menu-sync.module'
// Core features
import { DatabaseCoreModule } from './database-core/database-core.module'
import { MenuModule } from './menu/menu.module'
import { ParametersModule } from './parameters/parameters.module'
// Infrastructure features
import { QueryBuilderModule } from './query-builder/query-builder.module'
import { SearchModule } from './search/search.module'
import { SharedModule } from './shared/shared.module'
import { SocietesModule } from './societes/societes.module'
import { UIPreferencesModule } from './ui-preferences/ui-preferences.module'

// Uncomment as needed:
// import { NotificationsModule } from './notifications/notifications.module'
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
    MenuModule,
    ParametersModule,
    UIPreferencesModule,

    // Multi-tenant
    SocietesModule,
    SharedModule,

    // Infrastructure features
    QueryBuilderModule,
    SearchModule,

    // Features to reactivate progressively:
    // NotificationsModule,
    // MarketplaceAppModule,
  ],
  exports: [
    // Export all modules so they can be used by other modules
    DatabaseCoreModule,
    AdminModule,
    MenuSyncModule,
    MenuModule,
    ParametersModule,
    UIPreferencesModule,
    SocietesModule,
    SharedModule,
    QueryBuilderModule,
    SearchModule,
  ],
})
export class FeaturesModule {}

import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { TenantModule } from '../../shared/tenant/tenant.module'
import { ThemesController } from './controllers/themes.controller'
import { MarketplaceTheme } from './entities/marketplace-theme.entity'
import { MarketplaceThemesService } from './services/marketplace-themes.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketplaceTheme], 'marketplace'),
    TenantModule,
  ],
  providers: [
    MarketplaceThemesService,
  ],
  controllers: [
    ThemesController,
  ],
  exports: [
    MarketplaceThemesService,
  ],
})
export class ThemesModule {}

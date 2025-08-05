import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

import { MarketplaceTheme } from './entities/marketplace-theme.entity'

// TODO: Implémenter services et contrôleurs themes
// import { MarketplaceThemesService } from './services/marketplace-themes.service'
// import { ThemesController } from './controllers/themes.controller'

@Module({
  imports: [TypeOrmModule.forFeature([MarketplaceTheme], 'marketplace')],
  providers: [
    // MarketplaceThemesService,
  ],
  controllers: [
    // ThemesController,
  ],
  exports: [
    // MarketplaceThemesService,
  ],
})
export class ThemesModule {}

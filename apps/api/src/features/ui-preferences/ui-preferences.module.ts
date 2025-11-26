import { DatabaseModule } from '../../core/database/database.module'
import { Module } from '@nestjs/common'

import { UIPreferencesReorderableListController } from './controllers/ui-preferences-reorderable-list.controller'
import { UIPreferencesReorderableListService } from './services/ui-preferences-reorderable-list.service'

@Module({
  imports: [
    DatabaseModule,
  ],
  controllers: [
    UIPreferencesReorderableListController, // Clean - uses pure Prisma
  ],
  providers: [
    UIPreferencesReorderableListService, // Clean - uses pure Prisma
  ],
  exports: [
    UIPreferencesReorderableListService,
  ],
})
export class UIPreferencesModule {}

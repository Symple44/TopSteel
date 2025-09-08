import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UiPreferencesReorderableList } from '../../api/entities/ui-preferences-reorderable-list.entity'
import { UIPreferencesReorderableListController } from './controllers/ui-preferences-reorderable-list.controller'
import { UIPreferencesReorderableListService } from './services/ui-preferences-reorderable-list.service'

@Module({
  imports: [TypeOrmModule.forFeature([UiPreferencesReorderableList], 'auth')],
  controllers: [UIPreferencesReorderableListController],
  providers: [UIPreferencesReorderableListService],
  exports: [UIPreferencesReorderableListService],
})
export class UIPreferencesModule {}

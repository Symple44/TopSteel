import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'

// Entities
import { DatatableHierarchicalPreferences } from '../entities/datatable-hierarchical-preferences.entity'
import { DatatableHierarchyOrder } from '../entities/datatable-hierarchy-order.entity'
import { UiPreferencesReorderableList } from '../entities/ui-preferences-reorderable-list.entity'

// Services
import { DatatableHierarchicalPreferencesService } from '../services/datatable-hierarchical-preferences.service'
import { UiPreferencesReorderableListService } from '../services/ui-preferences-reorderable-list.service'

// Controllers
import { DatatableHierarchicalPreferencesController } from '../controllers/datatable-hierarchical-preferences.controller'
import { UiPreferencesReorderableListController } from '../controllers/ui-preferences-reorderable-list.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DatatableHierarchicalPreferences,
      DatatableHierarchyOrder,
      UiPreferencesReorderableList
    ])
  ],
  controllers: [
    DatatableHierarchicalPreferencesController,
    UiPreferencesReorderableListController
  ],
  providers: [
    DatatableHierarchicalPreferencesService,
    UiPreferencesReorderableListService
  ],
  exports: [
    DatatableHierarchicalPreferencesService,
    UiPreferencesReorderableListService
  ]
})
export class UiPreferencesModule {}
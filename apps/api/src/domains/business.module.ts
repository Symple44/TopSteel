import { Module } from '@nestjs/common'
import { InventoryModule } from './inventory/inventory.module'
import { MaterialsModule } from './materials/materials.module'
import { PartnersModule } from './partners/partners.module'

/**
 * Module central pour tous les domaines métier
 */
@Module({
  imports: [PartnersModule, InventoryModule, MaterialsModule],
  exports: [PartnersModule, InventoryModule, MaterialsModule],
})
export class BusinessModule {}

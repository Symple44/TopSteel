import { Module } from '@nestjs/common'
import { PartnersModule } from './partners/partners.module'
import { InventoryModule } from './inventory/inventory.module'
import { MaterialsModule } from './materials/materials.module'

/**
 * Module central pour tous les domaines métier
 */
@Module({
  imports: [PartnersModule, InventoryModule, MaterialsModule],
  exports: [PartnersModule, InventoryModule, MaterialsModule],
})
export class BusinessModule {}

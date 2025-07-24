// Export de toutes les entités partagées
export * from './shared-material.entity'
export * from './shared-supplier.entity'
export * from './shared-process.entity'
export * from './shared-quality-standard.entity'
export * from './shared-data-registry.entity'

// Liste des entités pour configuration TypeORM
import { SharedMaterial } from './shared-material.entity'
import { SharedSupplier } from './shared-supplier.entity'
import { SharedProcess } from './shared-process.entity'
import { SharedQualityStandard } from './shared-quality-standard.entity'

export const SharedEntities = [
  SharedMaterial,
  SharedSupplier,
  SharedProcess,
  SharedQualityStandard,
]
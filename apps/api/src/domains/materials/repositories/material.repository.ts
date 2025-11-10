import { IBusinessRepository } from '../../core/interfaces/business-service.interface'
import type {
  Material,
  MaterialShape,
  MaterialStatus,
  MaterialType,
  StorageMethod,
} from '../entities/material.entity'
import type {
  MaterialAdvancedFilters,
  MaterialCompatibilityAnalysis,
  MaterialSearchCriteria,
  MaterialStatistics,
  MaterialStockAlert,
  MechanicalPropertiesFilters,
} from '../types/material.types'

// Re-export types for external use
export type {
  MaterialAdvancedFilters,
  MaterialStockAlert,
  MaterialCompatibilityAnalysis,
  MechanicalPropertiesFilters,
}

/**
 * Interface du repository pour les matériaux
 */
export interface IMaterialRepository extends IBusinessRepository<Material> {
  /**
   * Trouver un matériau par sa référence
   */
  findByReference(reference: string): Promise<Material | null>

  /**
   * Trouver les matériaux par type
   */
  findByType(type: MaterialType): Promise<Material[]>

  /**
   * Trouver les matériaux par forme
   */
  findByShape(shape: MaterialShape): Promise<Material[]>

  /**
   * Trouver les matériaux par statut
   */
  findByStatus(status: MaterialStatus): Promise<Material[]>

  /**
   * Trouver les matériaux par nuance
   */
  findByNuance(nuance: string): Promise<Material[]>

  /**
   * Trouver les matériaux par fournisseur principal
   */
  findBySupplier(supplierId: string): Promise<Material[]>

  /**
   * Compter les matériaux par type
   */
  countByType(type: MaterialType): Promise<number>

  /**
   * Rechercher les matériaux selon des critères
   */
  searchByCriteria(criteria: MaterialSearchCriteria): Promise<Material[]>

  /**
   * Trouver les matériaux selon une condition de stock
   */
  findByStockCondition(
    condition: 'rupture' | 'sous_mini' | 'normal' | 'surstock'
  ): Promise<Material[]>

  /**
   * Vérifier si un matériau a des mouvements de stock
   */
  hasStockMovements(materialId: string): Promise<boolean>

  /**
   * Obtenir tous les matériaux
   */
  findAll(): Promise<Material[]>

  /**
   * Recherche avec pagination et filtres avancés
   */
  findWithFilters(filters: MaterialAdvancedFilters): Promise<{
    items: Material[]
    total: number
    page: number
    limit: number
  }>

  /**
   * Recherche textuelle dans les champs principaux
   */
  searchByText(searchText: string, limit?: number): Promise<Material[]>

  /**
   * Obtenir les statistiques des matériaux
   */
  getMaterialStats(): Promise<MaterialStatistics>

  /**
   * Obtenir les matériaux créés dans une période
   */
  findCreatedBetween(dateDebut: Date, dateFin: Date): Promise<Material[]>

  /**
   * Obtenir les matériaux modifiés récemment
   */
  findRecentlyModified(nbJours: number): Promise<Material[]>

  /**
   * Obtenir les matériaux par dimensions approximatives
   */
  findByDimensions(
    longueurMin?: number,
    longueurMax?: number,
    largeurMin?: number,
    largeurMax?: number,
    epaisseurMin?: number,
    epaisseurMax?: number
  ): Promise<Material[]>

  /**
   * Obtenir les matériaux par gamme de prix
   */
  findByPriceRange(prixMin?: number, prixMax?: number): Promise<Material[]>

  /**
   * Obtenir les matériaux nécessitant un stockage spécial
   */
  findRequiringSpecialStorage(): Promise<Material[]>

  /**
   * Obtenir les matériaux dangereux
   */
  findHazardousMaterials(): Promise<Material[]>

  /**
   * Obtenir les matériaux obsolètes
   */
  findObsoleteMaterials(): Promise<Material[]>

  /**
   * Obtenir les matériaux avec des certifications spécifiques
   */
  findByCertifications(certifications: string[]): Promise<Material[]>

  /**
   * Obtenir les matériaux par méthode de stockage
   */
  findByStorageMethod(storageMethod: StorageMethod): Promise<Material[]>

  /**
   * Obtenir les matériaux par propriétés mécaniques
   */
  findByMechanicalProperties(filters: MechanicalPropertiesFilters): Promise<Material[]>

  /**
   * Obtenir les matériaux par composition chimique
   */
  findByChemicalComposition(
    element: string,
    minPercentage?: number,
    maxPercentage?: number
  ): Promise<Material[]>

  /**
   * Obtenir la valorisation du stock par type
   */
  getStockValuationByType(): Promise<Record<MaterialType, { quantite: number; valeur: number }>>

  /**
   * Obtenir la valorisation du stock par forme
   */
  getStockValuationByShape(): Promise<Record<MaterialShape, { quantite: number; valeur: number }>>

  /**
   * Obtenir les mouvements de stock récents pour un matériau
   */
  getRecentStockMovements(materialId: string, limit: number): Promise<Record<string, unknown>[]>

  /**
   * Obtenir les matériaux les plus utilisés
   */
  getMostUsedMaterials(
    limit: number,
    periode?: { debut: Date; fin: Date }
  ): Promise<Array<Material & { quantiteUtilisee: number }>>

  /**
   * Obtenir les matériaux à rotation lente
   */
  getSlowMovingMaterials(nbJoursSansUtilisation: number): Promise<Material[]>

  /**
   * Obtenir les matériaux par emplacement de stockage
   */
  findByStorageLocation(emplacement: string): Promise<Material[]>

  /**
   * Obtenir les matériaux compatibles avec un matériau donné
   */
  findCompatibleMaterials(materialId: string): Promise<Material[]>

  /**
   * Obtenir les alternatives à un matériau obsolète
   */
  findAlternativeMaterials(obsoleteMaterialId: string): Promise<Material[]>

  /**
   * Vérifier l'existence de doublons potentiels
   */
  findPotentialDuplicates(material: Material): Promise<Material[]>

  /**
   * Obtenir les matériaux par fournisseur préféré
   */
  findByPreferredSuppliers(): Promise<Material[]>

  /**
   * Obtenir les matériaux nécessitant un réapprovisionnement
   */
  findRequiringRestock(): Promise<Array<Material & { quantiteACommander: number }>>

  /**
   * Obtenir les matériaux par classe de danger
   */
  findByHazardClass(hazardClass: string): Promise<Material[]>

  /**
   * Obtenir les statistiques d'utilisation par période
   */
  getUsageStatsByPeriod(
    debut: Date,
    fin: Date
  ): Promise<
    Array<{
      materialId: string
      reference: string
      nom: string
      quantiteEntree: number
      quantiteSortie: number
      quantiteStock: number
      valeurStock: number
    }>
  >
}

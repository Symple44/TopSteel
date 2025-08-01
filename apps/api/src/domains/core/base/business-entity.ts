import { CommonEntity } from '../../../core/database/entities/base/multi-tenant.entity'

/**
 * Entité métier de base avec fonctionnalités communes
 */
export abstract class BusinessEntity extends CommonEntity {
  /**
   * Note: version est héritée de BaseEntity via CommonEntity
   */

  /**
   * Métadonnées métier extensibles
   */
  businessMetadata?: Record<string, any>

  /**
   * Règles de validation métier
   */
  abstract validate(): string[]

  /**
   * Vérifier si l'entité est dans un état valide
   */
  isValid(): boolean {
    return this.validate().length === 0
  }

  /**
   * Obtenir les erreurs de validation
   */
  getValidationErrors(): string[] {
    return this.validate()
  }

  /**
   * Marquer l'entité comme modifiée (pour audit)
   */
  markAsModified(userId?: string): void {
    this.updatedAt = new Date()
    if (userId) {
      this.businessMetadata = {
        ...this.businessMetadata,
        lastModifiedBy: userId,
        lastModifiedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Copier les propriétés communes depuis une autre entité
   */
  protected copyCommonFields(source: Partial<BusinessEntity>): void {
    if (source.businessMetadata) {
      this.businessMetadata = { ...source.businessMetadata }
    }
    // Note: version is inherited from BaseEntity via CommonEntity
  }
}
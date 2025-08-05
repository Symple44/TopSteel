import type { BusinessEntity } from '@erp/entities'

/**
 * Interface de base pour tous les services métier
 */
export interface IBusinessService<T extends BusinessEntity> {
  /**
   * Créer une nouvelle entité métier
   */
  create(data: Partial<T>, context?: BusinessContext): Promise<T>

  /**
   * Mettre à jour une entité existante
   */
  update(id: string, data: Partial<T>, context?: BusinessContext): Promise<T>

  /**
   * Supprimer une entité (soft delete)
   */
  delete(id: string, context?: BusinessContext): Promise<void>

  /**
   * Récupérer une entité par ID
   */
  findById(id: string, context?: BusinessContext): Promise<T | null>

  /**
   * Valider les règles métier avant une opération
   */
  validateBusinessRules(entity: T, operation: BusinessOperation): Promise<ValidationResult>
}

/**
 * Interface pour les repository métier
 */
export interface IBusinessRepository<T extends BusinessEntity> {
  create(entity: T): Promise<T>
  update(id: string, entity: Partial<T>): Promise<T>
  delete(id: string): Promise<void>
  findById(id: string): Promise<T | null>
  findBySpecification(spec: ISpecification<T>): Promise<T[]>
  save(entity: T): Promise<T>
}

/**
 * Pattern Specification pour les requêtes complexes
 */
export interface ISpecification<T> {
  isSatisfiedBy(entity: T): boolean
  and(other: ISpecification<T>): ISpecification<T>
  or(other: ISpecification<T>): ISpecification<T>
  not(): ISpecification<T>
}

/**
 * Contexte métier pour les opérations
 */
export interface BusinessContext {
  userId: string
  tenantId: string
  userRoles: string[]
  permissions: string[]
  metadata?: Record<string, any>
}

/**
 * Types d'opérations métier
 */
export enum BusinessOperation {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VALIDATE = 'VALIDATE',
  PROCESS = 'PROCESS',
}

/**
 * Résultat de validation métier
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings?: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationWarning {
  field: string
  message: string
  code: string
}

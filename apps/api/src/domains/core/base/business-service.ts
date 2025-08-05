import type { BusinessEntity } from '@erp/entities'
import { Injectable, Logger } from '@nestjs/common'
import {
  type BusinessContext,
  BusinessOperation,
  type IBusinessRepository,
  type IBusinessService,
  type ValidationResult,
} from '../interfaces/business-service.interface'

/**
 * Service métier de base avec fonctionnalités communes
 */
@Injectable()
export abstract class BusinessService<T extends BusinessEntity> implements IBusinessService<T> {
  protected readonly logger: Logger

  constructor(
    protected readonly repository: IBusinessRepository<T>,
    loggerContext?: string
  ) {
    this.logger = new Logger(loggerContext || this.constructor.name)
  }

  /**
   * Créer une nouvelle entité métier
   */
  async create(data: Partial<T>, context?: BusinessContext): Promise<T> {
    this.logger.log(`Creating new ${this.getEntityName()}`)

    // 1. Créer l'entité
    const entity = await this.buildEntity(data)

    // 2. Valider les règles métier
    const validation = await this.validateBusinessRules(entity, BusinessOperation.CREATE)
    if (!validation.isValid) {
      throw new BusinessValidationError('Validation failed', validation.errors)
    }

    // 3. Appliquer les hooks avant création
    await this.beforeCreate(entity, context)

    // 4. Sauvegarder
    const savedEntity = await this.repository.create(entity)

    // 5. Appliquer les hooks après création
    await this.afterCreate(savedEntity, context)

    this.logger.log(`${this.getEntityName()} created with ID: ${(savedEntity as any).id}`)
    return savedEntity
  }

  /**
   * Mettre à jour une entité existante
   */
  async update(id: string, data: Partial<T>, context?: BusinessContext): Promise<T> {
    this.logger.log(`Updating ${this.getEntityName()} with ID: ${id}`)

    // 1. Récupérer l'entité existante
    const existingEntity = await this.repository.findById(id)
    if (!existingEntity) {
      throw new BusinessEntityNotFoundError(`${this.getEntityName()} not found`)
    }

    // 2. Appliquer les modifications
    const updatedEntity = await this.applyUpdates(existingEntity, data)

    // 3. Valider les règles métier
    const validation = await this.validateBusinessRules(updatedEntity, BusinessOperation.UPDATE)
    if (!validation.isValid) {
      throw new BusinessValidationError('Validation failed', validation.errors)
    }

    // 4. Hooks avant mise à jour
    await this.beforeUpdate(updatedEntity, existingEntity, context)

    // 5. Sauvegarder
    const savedEntity = await this.repository.update(id, updatedEntity)

    // 6. Hooks après mise à jour
    await this.afterUpdate(savedEntity, existingEntity, context)

    return savedEntity
  }

  /**
   * Supprimer une entité
   */
  async delete(id: string, context?: BusinessContext): Promise<void> {
    this.logger.log(`Deleting ${this.getEntityName()} with ID: ${id}`)

    const entity = await this.repository.findById(id)
    if (!entity) {
      throw new BusinessEntityNotFoundError(`${this.getEntityName()} not found`)
    }

    // Valider si la suppression est autorisée
    const validation = await this.validateBusinessRules(entity, BusinessOperation.DELETE)
    if (!validation.isValid) {
      throw new BusinessValidationError('Cannot delete entity', validation.errors)
    }

    await this.beforeDelete(entity, context)
    await this.repository.delete(id)
    await this.afterDelete(entity, context)
  }

  /**
   * Récupérer par ID
   */
  async findById(id: string, context?: BusinessContext): Promise<T | null> {
    return await this.repository.findById(id)
  }

  /**
   * Validation des règles métier - à implémenter dans les classes filles
   */
  abstract validateBusinessRules(entity: T, operation: BusinessOperation): Promise<ValidationResult>

  /**
   * Construire une entité à partir des données - à implémenter
   */
  protected abstract buildEntity(data: Partial<T>): Promise<T>

  /**
   * Appliquer les mises à jour - à implémenter
   */
  protected abstract applyUpdates(existing: T, updates: Partial<T>): Promise<T>

  /**
   * Obtenir le nom de l'entité pour les logs
   */
  protected abstract getEntityName(): string

  // Hooks - peuvent être surchargés dans les classes filles
  protected async beforeCreate(entity: T, context?: BusinessContext): Promise<void> {}
  protected async afterCreate(entity: T, context?: BusinessContext): Promise<void> {}
  protected async beforeUpdate(entity: T, original: T, context?: BusinessContext): Promise<void> {}
  protected async afterUpdate(entity: T, original: T, context?: BusinessContext): Promise<void> {}
  protected async beforeDelete(entity: T, context?: BusinessContext): Promise<void> {}
  protected async afterDelete(entity: T, context?: BusinessContext): Promise<void> {}
}

/**
 * Erreurs métier
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'BusinessError'
  }
}

export class BusinessValidationError extends BusinessError {
  constructor(
    message: string,
    public errors: any[]
  ) {
    super(message)
    this.name = 'BusinessValidationError'
  }
}

export class BusinessEntityNotFoundError extends BusinessError {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessEntityNotFoundError'
  }
}

import { Injectable, Logger } from '@nestjs/common'
import { OnEvent } from '@nestjs/event-emitter'
import { SearchIndexingOperationsService } from './search-indexing-operations.service'
import { getEntityByType } from '../config/searchable-entities.config'
import { 
  PartnerRecord, 
  ArticleRecord, 
  MaterialRecord, 
  ProjetRecord, 
  DevisRecord, 
  FactureRecord, 
  MenuRecord, 
  UserRecord,
  IndexingDocument,
  SearchDocument
} from '../types/search-types'
import { convertToSearchDocument } from '../utils/search-document-converter'

/**
 * Service d'indexation automatique pour la recherche
 * Écoute les événements de création/modification/suppression des entités
 */
@Injectable()
export class SearchIndexingService {
  private readonly logger = new Logger(SearchIndexingService.name)

  constructor(private readonly indexingOperations: SearchIndexingOperationsService) {}

  // ========== PARTNERS (Clients/Fournisseurs) ==========
  
  @OnEvent('partner.created')
  async onPartnerCreated(payload: { id: string; data: PartnerRecord }) {
    try {
      const type = payload.data.partner_type === 'SUPPLIER' ? 'fournisseur' : 'client'
      const entity = getEntityByType(type)
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument(type, payload.id, document)
      this.logger.debug(`Indexed new ${type}: ${payload.data.code}`)
    } catch (error) {
      this.logger.error('Failed to index partner:', error)
    }
  }

  @OnEvent('partner.updated')
  async onPartnerUpdated(payload: { id: string; data: PartnerRecord }) {
    await this.onPartnerCreated(payload) // Même logique pour la mise à jour
  }

  @OnEvent('partner.deleted')
  async onPartnerDeleted(payload: { id: string; type: string }) {
    try {
      const type = payload.type === 'SUPPLIER' ? 'fournisseur' : 'client'
      await this.indexingOperations.deleteDocument(type, payload.id)
      this.logger.debug(`Removed ${type} from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove partner from index:', error)
    }
  }

  // ========== ARTICLES ==========

  @OnEvent('article.created')
  async onArticleCreated(payload: { id: string; data: ArticleRecord }) {
    try {
      const entity = getEntityByType('article')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('article', payload.id, document)
      this.logger.debug(`Indexed new article: ${payload.data.reference}`)
    } catch (error) {
      this.logger.error('Failed to index article:', error)
    }
  }

  @OnEvent('article.updated')
  async onArticleUpdated(payload: { id: string; data: ArticleRecord }) {
    await this.onArticleCreated(payload)
  }

  @OnEvent('article.deleted')
  async onArticleDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('article', payload.id)
      this.logger.debug(`Removed article from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove article from index:', error)
    }
  }

  // ========== MATERIALS ==========

  @OnEvent('material.created')
  async onMaterialCreated(payload: { id: string; data: MaterialRecord }) {
    try {
      const entity = getEntityByType('material')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('material', payload.id, document)
      this.logger.debug(`Indexed new material: ${payload.data.reference}`)
    } catch (error) {
      this.logger.error('Failed to index material:', error)
    }
  }

  @OnEvent('material.updated')
  async onMaterialUpdated(payload: { id: string; data: MaterialRecord }) {
    await this.onMaterialCreated(payload)
  }

  @OnEvent('material.deleted')
  async onMaterialDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('material', payload.id)
      this.logger.debug(`Removed material from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove material from index:', error)
    }
  }

  // ========== PROJETS ==========

  @OnEvent('projet.created')
  async onProjetCreated(payload: { id: string; data: ProjetRecord }) {
    try {
      const entity = getEntityByType('projet')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('projet', payload.id, document)
      this.logger.debug(`Indexed new projet: ${payload.data.code}`)
    } catch (error) {
      this.logger.error('Failed to index projet:', error)
    }
  }

  @OnEvent('projet.updated')
  async onProjetUpdated(payload: { id: string; data: ProjetRecord }) {
    await this.onProjetCreated(payload)
  }

  @OnEvent('projet.deleted')
  async onProjetDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('projet', payload.id)
      this.logger.debug(`Removed projet from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove projet from index:', error)
    }
  }

  // ========== DEVIS ==========

  @OnEvent('devis.created')
  async onDevisCreated(payload: { id: string; data: DevisRecord }) {
    try {
      const entity = getEntityByType('devis')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('devis', payload.id, document)
      this.logger.debug(`Indexed new devis: ${payload.data.numero}`)
    } catch (error) {
      this.logger.error('Failed to index devis:', error)
    }
  }

  @OnEvent('devis.updated')
  async onDevisUpdated(payload: { id: string; data: DevisRecord }) {
    await this.onDevisCreated(payload)
  }

  @OnEvent('devis.deleted')
  async onDevisDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('devis', payload.id)
      this.logger.debug(`Removed devis from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove devis from index:', error)
    }
  }

  // ========== FACTURES ==========

  @OnEvent('facture.created')
  async onFactureCreated(payload: { id: string; data: FactureRecord }) {
    try {
      const entity = getEntityByType('facture')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('facture', payload.id, document)
      this.logger.debug(`Indexed new facture: ${payload.data.numero}`)
    } catch (error) {
      this.logger.error('Failed to index facture:', error)
    }
  }

  @OnEvent('facture.updated')
  async onFactureUpdated(payload: { id: string; data: FactureRecord }) {
    await this.onFactureCreated(payload)
  }

  @OnEvent('facture.deleted')
  async onFactureDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('facture', payload.id)
      this.logger.debug(`Removed facture from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove facture from index:', error)
    }
  }

  // ========== MENUS ==========

  @OnEvent('menu.created')
  async onMenuCreated(payload: { id: string; data: MenuRecord }) {
    try {
      const entity = getEntityByType('menu')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('menu', payload.id, document)
      this.logger.debug(`Indexed new menu: ${payload.data.title}`)
    } catch (error) {
      this.logger.error('Failed to index menu:', error)
    }
  }

  @OnEvent('menu.updated')
  async onMenuUpdated(payload: { id: string; data: MenuRecord }) {
    await this.onMenuCreated(payload)
  }

  @OnEvent('menu.deleted')
  async onMenuDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('menu', payload.id)
      this.logger.debug(`Removed menu from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove menu from index:', error)
    }
  }

  // ========== USERS ==========

  @OnEvent('user.created')
  async onUserCreated(payload: { id: string; data: UserRecord }) {
    try {
      const entity = getEntityByType('user')
      if (!entity) return

      const document = convertToSearchDocument(entity, payload.id, payload.data)

      await this.indexingOperations.indexDocument('user', payload.id, document)
      this.logger.debug(`Indexed new user: ${payload.data.email}`)
    } catch (error) {
      this.logger.error('Failed to index user:', error)
    }
  }

  @OnEvent('user.updated')
  async onUserUpdated(payload: { id: string; data: UserRecord }) {
    await this.onUserCreated(payload)
  }

  @OnEvent('user.deleted')
  async onUserDeleted(payload: { id: string }) {
    try {
      await this.indexingOperations.deleteDocument('user', payload.id)
      this.logger.debug(`Removed user from index: ${payload.id}`)
    } catch (error) {
      this.logger.error('Failed to remove user from index:', error)
    }
  }

  // ========== BATCH INDEXING ==========

  /**
   * Indexer plusieurs documents en batch
   */
  async indexBatch(documents: IndexingDocument[]) {
    return this.indexingOperations.indexBatch(documents)
  }

  /**
   * Supprimer plusieurs documents en batch
   */
  async deleteBatch(documents: Array<{ type: string; id: string }>) {
    return this.indexingOperations.deleteBatch(documents)
  }
}
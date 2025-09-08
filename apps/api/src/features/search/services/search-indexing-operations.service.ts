import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import { SEARCHABLE_ENTITIES, type SearchableEntity } from '../config/searchable-entities.config'
import type { ISearchIndexingService } from '../interfaces/search.interfaces'
import type { IndexingBatchResult, IndexingDocument, SearchDocument } from '../types/search-types'
import type { ElasticsearchSearchService } from './elasticsearch-search.service'
import type { SearchResultFormatterService } from './search-result-formatter.service'

@Injectable()
export class SearchIndexingOperationsService implements ISearchIndexingService {
  private readonly logger = new Logger(SearchIndexingOperationsService.name)

  constructor(
    @InjectDataSource('auth') private readonly dataSource: DataSource,
    @InjectDataSource('tenant') private readonly tenantDataSource: DataSource,
    private readonly elasticsearchService: ElasticsearchSearchService,
    private readonly formatter: SearchResultFormatterService
  ) {}

  async indexDocument(type: string, id: string, document: SearchDocument): Promise<void> {
    try {
      await this.elasticsearchService.indexDocument(type, id, document)
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Indexed document ${type}/${id}`)
      }
    } catch (error) {
      this.logger.error(`Failed to index document ${type}/${id}:`, error)
    }
  }

  async deleteDocument(type: string, id: string): Promise<void> {
    try {
      await this.elasticsearchService.deleteDocument(type, id)
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(`Deleted document ${type}/${id}`)
      }
    } catch (error) {
      this.logger.error(`Failed to delete document ${type}/${id}:`, error)
    }
  }

  async reindexAll(tenantId?: string): Promise<number> {
    const isElasticsearchAvailable = await this.elasticsearchService.isAvailable()
    if (!isElasticsearchAvailable) {
      this.logger.warn('Reindexing only available with ElasticSearch')
      return 0
    }

    this.logger.log('🔄 Starting full reindex...')

    let totalIndexed = 0
    const errors: string[] = []

    // Reindex all configured entities
    for (const entity of SEARCHABLE_ENTITIES) {
      if (!entity.enabled) continue

      try {
        const count = await this.reindexEntity(entity, tenantId)
        totalIndexed += count
        this.logger.log(`✅ Indexed ${count} ${entity.type} documents`)
      } catch (error) {
        const errorMsg = `Failed to reindex ${entity.type}: ${error}`
        this.logger.error(errorMsg)
        errors.push(errorMsg)
      }
    }

    this.logger.log(`🎯 Full reindex completed: ${totalIndexed} documents indexed`)
    if (errors.length > 0) {
      this.logger.error(`❌ Errors during reindex: ${errors.join(', ')}`)
    }

    return totalIndexed
  }

  async reindexEntity(entity: SearchableEntity, tenantId?: string): Promise<number> {
    // Determine which datasource to use
    const ds =
      entity.database === 'tenant' && this.tenantDataSource
        ? this.tenantDataSource
        : this.dataSource

    // Check if table exists before reindexing
    const tableExists = await this.checkTableExists(ds, entity.tableName)
    if (!tableExists) {
      this.logger.warn(
        `Table ${entity.tableName} does not exist, skipping reindex for ${entity.type}`
      )
      return 0
    }

    // Build query to get all records
    const fields = [
      ...entity.searchableFields.primary.map((f) => f.name),
      ...entity.searchableFields.secondary.map((f) => f.name),
      ...entity.searchableFields.metadata.map((f) => f.name),
    ].filter((v, i, a) => a.indexOf(v) === i) // Unique

    // Add societe_id if it's a tenant entity
    if (entity.database === 'tenant' && !fields.includes('societe_id')) {
      fields.push('societe_id')
    }

    const query = `
      SELECT 
        id::text as id,
        ${fields.join(', ')}
      FROM ${entity.tableName}
      ${entity.type === 'client' ? "WHERE type = 'CLIENT'" : ''}
      ${entity.type === 'fournisseur' ? "WHERE type = 'SUPPLIER'" : ''}
      LIMIT 1000
    `

    const records = await ds.query(query)

    // Index each record
    for (const record of records) {
      // Determine tenantId based on database
      let documentTenantId: string | undefined
      if (entity.database === 'tenant') {
        // For tenant entities, use societe_id from record
        documentTenantId = record.societe_id || tenantId
      } else if (entity.database === 'auth' && entity.type === 'user') {
        // For users, use their default societe_id
        documentTenantId = record.societe_id_default
      } else if (entity.database === 'shared') {
        // For shared entities, no tenantId
        documentTenantId = undefined
      }

      const document = {
        title: this.formatter.getRecordTitle(entity, record),
        description: this.formatter.getRecordDescription(entity, record),
        url: entity.urlPattern.replace('{id}', record.id),
        icon: entity.icon,
        type: entity.type,
        tenantId: documentTenantId,
        ...record,
      }

      await this.indexDocument(entity.type, record.id, document)
    }

    return records.length
  }

  private async checkTableExists(dataSource: DataSource, tableName: string): Promise<boolean> {
    try {
      const result = await dataSource.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      )
      return result[0]?.exists || false
    } catch (error) {
      this.logger.warn(`Error checking if table ${tableName} exists:`, error)
      return false
    }
  }

  /**
   * Index multiple documents in batch
   */
  async indexBatch(documents: IndexingDocument[]): Promise<IndexingBatchResult> {
    const promises = documents.map(async (doc) => {
      try {
        // Convert database record to SearchDocument
        const searchDoc: SearchDocument = {
          id: doc.id,
          type: doc.type,
          title: this.formatter.getRecordTitle(
            SEARCHABLE_ENTITIES.find((e) => e.type === doc.type)!,
            doc.data
          ),
          description: this.formatter.getRecordDescription(
            SEARCHABLE_ENTITIES.find((e) => e.type === doc.type)!,
            doc.data
          ),
          metadata: this.formatter.extractMetadata(
            SEARCHABLE_ENTITIES.find((e) => e.type === doc.type)!,
            doc.data
          ),
        }

        await this.indexDocument(doc.type, doc.id, searchDoc)
        return { success: true, id: doc.id, type: doc.type }
      } catch (error) {
        return { success: false, id: doc.id, type: doc.type, error: String(error) }
      }
    })

    const results = await Promise.allSettled(promises)
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value.success).length
    const failed = results.length - successful
    const errors = results
      .filter((r) => r.status === 'fulfilled' && !r.value.success)
      .map((r) =>
        r.status === 'fulfilled'
          ? { id: r.value.id, type: r.value.type, error: r.value.error || 'Unknown error' }
          : { id: '', type: '', error: 'Unknown error' }
      )

    this.logger.debug(
      `Batch indexed ${documents.length} documents: ${successful} successful, ${failed} failed`
    )

    return { successful, failed, errors }
  }

  /**
   * Delete multiple documents in batch
   */
  async deleteBatch(documents: Array<{ type: string; id: string }>) {
    const promises = documents.map((doc) => this.deleteDocument(doc.type, doc.id))

    await Promise.allSettled(promises)
    this.logger.debug(`Batch deleted ${documents.length} documents`)
  }
}

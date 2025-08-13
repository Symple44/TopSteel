import { Injectable, Logger } from '@nestjs/common'
import { InjectDataSource } from '@nestjs/typeorm'
import type { DataSource } from 'typeorm'
import {
  generateSearchQuery,
  getAccessibleEntities,
  type SearchableEntity,
} from '../config/searchable-entities.config'
import type {
  IPostgreSQLSearchService,
  SearchOptions,
  SearchResponse,
  SearchResult,
} from '../interfaces/search.interfaces'
import type { AnyDatabaseRecord, SearchDocument } from '../types/search-types'
import type { SearchResultFormatterService } from './search-result-formatter.service'

@Injectable()
export class PostgreSQLSearchService implements IPostgreSQLSearchService {
  private readonly logger = new Logger(PostgreSQLSearchService.name)

  constructor(
    @InjectDataSource('auth') private readonly dataSource: DataSource,
    @InjectDataSource('tenant') private readonly tenantDataSource: DataSource,
    private readonly formatter: SearchResultFormatterService
  ) {}

  async isAvailable(): Promise<boolean> {
    return this.dataSource.isInitialized
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now()

    try {
      const results: SearchResult[] = []

      // Get accessible entities based on permissions
      const accessibleEntities = getAccessibleEntities(
        options.permissions || [],
        options.roles || []
      )

      // Filter by types if specified
      const entitiesToSearch = options.types
        ? accessibleEntities.filter((e) => options.types?.includes(e.type))
        : accessibleEntities

      // Search in each entity
      for (const entity of entitiesToSearch) {
        try {
          const entityResults = await this.searchEntity(entity, options)
          results.push(...entityResults)
        } catch (error) {
          this.logger.warn(`Failed to search in ${entity.type}:`, error)
        }
      }

      // Sort by relevance score
      results.sort((a, b) => (b.score || 0) - (a.score || 0))

      // Apply pagination
      const limitedResults = results.slice(
        options.offset || 0,
        (options.offset || 0) + (options.limit || 10)
      )

      // Sanitize results
      const sanitizedResults = this.formatter.sanitizeResults(limitedResults)

      // Calculate facets
      const facets = this.formatter.calculateFacetsFromResults(results)

      return {
        results: sanitizedResults,
        total: results.length,
        took: Date.now() - startTime,
        searchEngine: 'postgresql',
        facets,
      }
    } catch (error) {
      this.logger.error('PostgreSQL search error:', error)
      throw error
    }
  }

  async searchEntity(entity: SearchableEntity, options: SearchOptions): Promise<SearchResult[]> {
    // Determine which datasource to use
    const ds =
      entity.database === 'tenant' && this.tenantDataSource
        ? this.tenantDataSource
        : this.dataSource

    // Check if table exists before searching
    const tableExists = await this.checkTableExists(entity.tableName)
    if (!tableExists) {
      this.logger.warn(
        `Table ${entity.tableName} does not exist, skipping search for ${entity.type}`
      )
      return []
    }

    // For menus, add additional filtering based on user roles/permissions
    if (entity.type === 'menu' && (!options.roles || !options.roles.includes('admin'))) {
      // If user is not admin, filter menus according to their permissions
      if (!options.roles || options.roles.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug('User has no roles, skipping menu search')
        }
        return []
      }
    }

    // Generate SQL query
    const { query, params } = generateSearchQuery(entity, options.query, options.tenantId)

    try {
      const records = await ds.query(query, params)

      return records.map((record: AnyDatabaseRecord) =>
        this.formatter.formatEntityResult(entity, record, options.query)
      )
    } catch (error) {
      this.logger.error(`Error searching ${entity.type}:`, error)
      return []
    }
  }

  async checkTableExists(tableName: string): Promise<boolean> {
    try {
      const result = await this.dataSource.query(
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

  // PostgreSQL doesn't support direct document indexing, so these are no-ops
  async indexDocument(type: string, id: string, _document: SearchDocument): Promise<void> {
    // PostgreSQL search doesn't require indexing - data is searched directly
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`PostgreSQL doesn't require indexing for ${type}/${id}`)
    }
  }

  async deleteDocument(type: string, id: string): Promise<void> {
    // PostgreSQL search doesn't require document deletion - data is searched directly
    if (process.env.NODE_ENV === 'development') {
      this.logger.debug(`PostgreSQL doesn't require document deletion for ${type}/${id}`)
    }
  }
}

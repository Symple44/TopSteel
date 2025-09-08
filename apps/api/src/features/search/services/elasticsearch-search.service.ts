import { Client, type ClientOptions } from '@elastic/elasticsearch'
import { Injectable, Logger } from '@nestjs/common'
import type { ConfigService } from '@nestjs/config'
import { getErrorMessage, toError } from '../../../core/common/utils'
import { getElasticsearchMapping } from '../config/searchable-entities.config'
import type {
  IElasticsearchSearchService,
  SearchOptions,
  SearchResponse,
} from '../interfaces/search.interfaces'
import type {
  ElasticsearchQuery,
  ElasticsearchSearchResponse,
  SearchDocument,
} from '../types/search-types'
import type { SearchResultFormatterService } from './search-result-formatter.service'

@Injectable()
export class ElasticsearchSearchService implements IElasticsearchSearchService {
  private readonly logger = new Logger(ElasticsearchSearchService.name)
  private readonly indexName = 'topsteel_global'
  private client: Client | null = null

  constructor(
    readonly _configService: ConfigService,
    private readonly formatter: SearchResultFormatterService
  ) {
    this.initializeClient()
  }

  private initializeClient() {
    const config: ClientOptions = {
      node:
        process.env.ELASTICSEARCH_NODE || process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      maxRetries: 3,
      requestTimeout: 30000,
    }

    if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      }
    }

    this.client = new Client(config)
  }

  async isAvailable(): Promise<boolean> {
    try {
      if (!this.client) return false
      await this.client.ping()
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('ElasticSearch not available:', getErrorMessage(error))
      }
      return false
    }
  }

  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now()

    try {
      const searchBody = this.buildQuery(options)
      if (!this.client) throw new Error('ElasticSearch client not initialized')

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('ElasticSearch query:', JSON.stringify(searchBody, null, 2))
      }

      const response = (await this.client.search({
        index: this.indexName,
        ...searchBody,
      } as unknown)) as ElasticsearchSearchResponse

      if (process.env.NODE_ENV === 'development') {
        this.logger.debug(
          `ElasticSearch response: ${response.hits.total.value || response.hits.total} results found`
        )
      }

      const rawResults = this.formatter.formatResults(response.hits.hits, 'elasticsearch')
      const results = this.formatter.sanitizeResults(rawResults)
      const suggestions = this.formatter.extractSuggestions(response)
      const facets = this.formatter.extractFacets(response)

      return {
        results,
        total:
          typeof response.hits.total === 'object' ? response.hits.total.value : response.hits.total,
        took: Date.now() - startTime,
        searchEngine: 'elasticsearch',
        suggestions,
        facets,
      }
    } catch (error) {
      this.logger.error('ElasticSearch search error:', error)
      throw error
    }
  }

  buildQuery(options: SearchOptions): ElasticsearchQuery {
    const must: Array<Record<string, unknown>> = []
    const filter: Array<Record<string, unknown>> = []

    // Main query with boost on different fields
    must.push({
      multi_match: {
        query: options.query,
        fields: [
          'title^3',
          'title.keyword^2',
          'description',
          'searchableContent',
          'code^2',
          'reference^2',
          'denomination^2',
          'email',
          'tags',
        ],
        type: 'best_fields',
        fuzziness: 'AUTO',
        prefix_length: 2,
      },
    })

    // Tenant filter for multi-tenant security
    if (options.tenantId) {
      filter.push({
        bool: {
          should: [
            { term: { tenantId: options.tenantId } },
            { bool: { must_not: { exists: { field: 'tenantId' } } } },
          ],
          minimum_should_match: 1,
        },
      })
    }

    // Type filters
    if (options.types && options.types.length > 0) {
      filter.push({ terms: { type: options.types } })
    }

    // Security filters - roles
    if (options.roles && options.roles.length > 0) {
      filter.push({
        bool: {
          should: [
            { terms: { accessRoles: options.roles } },
            { bool: { must_not: { exists: { field: 'accessRoles' } } } },
          ],
        },
      })
    }

    // Security filters - permissions
    if (options.permissions && options.permissions.length > 0) {
      filter.push({
        bool: {
          should: [
            { terms: { accessPermissions: options.permissions } },
            { bool: { must_not: { exists: { field: 'accessPermissions' } } } },
          ],
        },
      })
    }

    return {
      query: {
        bool: {
          must,
          filter,
        },
      },
      size: options.limit || 10,
      from: options.offset || 0,
      highlight: {
        fields: {
          title: { number_of_fragments: 1 },
          description: { number_of_fragments: 2 },
          denomination: { number_of_fragments: 1 },
        },
        pre_tags: ['<mark>'],
        post_tags: ['</mark>'],
      },
      aggs: {
        types: {
          terms: {
            field: 'type',
            size: 10,
          },
        },
      },
    }
  }

  async indexDocument(type: string, id: string, document: SearchDocument): Promise<void> {
    if (!this.client) throw new Error('ElasticSearch client not initialized')

    await this.client.index({
      index: this.indexName,
      id: `${type}_${id}`,
      document: {
        ...document,
        type,
        id,
        indexedAt: new Date().toISOString(),
      },
    })
  }

  async deleteDocument(type: string, id: string): Promise<void> {
    if (!this.client) throw new Error('ElasticSearch client not initialized')

    try {
      await this.client.delete({
        index: this.indexName,
        id: `${type}_${id}`,
      })
    } catch (error) {
      // Don't throw error if document doesn't exist
      const err = toError(error) as unknown
      if (err.meta?.statusCode !== 404) {
        throw error
      }
    }
  }

  async createIndex(): Promise<void> {
    try {
      if (!this.client) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.debug('ElasticSearch client not initialized')
        }
        return
      }

      // Check if index already exists
      const exists = await this.client.indices.exists({ index: this.indexName })
      if (!exists) {
        await this.client.indices.create({
          index: this.indexName,
          settings: {
            analysis: {
              analyzer: {
                french_analyzer: {
                  type: 'standard' as const,
                  stopwords: '_french_',
                },
              },
            },
          },
          mappings: getElasticsearchMapping(),
        })
        this.logger.log('✅ ElasticSearch index created successfully')
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.debug('ElasticSearch index creation skipped:', getErrorMessage(error))
      }
    }
  }

  getClient(): Client | null {
    return this.client
  }
}

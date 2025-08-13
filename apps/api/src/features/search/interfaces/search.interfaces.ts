import { 
  SearchMetadata, 
  SearchDocument, 
  ElasticsearchSearchResponse, 
  AnyDatabaseRecord,
  ElasticsearchQuery 
} from '../types/search-types'
import { SearchableEntity } from '../config/searchable-entities.config'

export interface SearchResult {
  type: string
  id: string
  title: string
  description?: string
  url?: string
  icon?: string
  metadata?: SearchMetadata
  score?: number
  highlight?: {
    title?: string[]
    description?: string[]
  }
}

export interface SearchOptions {
  query: string
  types?: string[]
  limit?: number
  offset?: number
  tenantId?: string
  userId?: string
  roles?: string[]
  permissions?: string[]
  filters?: Record<string, unknown>
  entityTypes?: string[]
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  took: number
  searchEngine: 'elasticsearch' | 'postgresql'
  suggestions?: string[]
  facets?: Record<string, { value: string; count: number }[]>
  metadata?: Record<string, unknown>
}

export interface ISearchStrategy {
  search(options: SearchOptions): Promise<SearchResponse>
  isAvailable(): Promise<boolean>
  indexDocument?(type: string, id: string, document: SearchDocument): Promise<void>
  deleteDocument?(type: string, id: string): Promise<void>
}

export interface ISearchResultFormatter {
  formatResults(rawResults: AnyDatabaseRecord[] | ElasticsearchSearchResponse['hits']['hits'], engine: 'elasticsearch' | 'postgresql'): SearchResult[]
  sanitizeResults(results: SearchResult[]): SearchResult[]
  extractSuggestions(response: ElasticsearchSearchResponse): string[]
  extractFacets(response: ElasticsearchSearchResponse): Record<string, { value: string; count: number }[]>
}

export interface IElasticsearchSearchService extends ISearchStrategy {
  createIndex(): Promise<void>
  buildQuery(options: SearchOptions): ElasticsearchQuery
}

export interface IPostgreSQLSearchService extends ISearchStrategy {
  searchEntity(entity: SearchableEntity, options: SearchOptions): Promise<SearchResult[]>
  checkTableExists(tableName: string): Promise<boolean>
}

export interface ISearchIndexingService {
  indexDocument(type: string, id: string, document: SearchDocument): Promise<void>
  deleteDocument(type: string, id: string): Promise<void>
  reindexAll(tenantId?: string): Promise<number>
  reindexEntity(entity: SearchableEntity, tenantId?: string): Promise<number>
}
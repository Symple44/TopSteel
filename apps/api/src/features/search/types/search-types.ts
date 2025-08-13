// Common types for search system
export interface SearchMetadata {
  [key: string]: string | number | boolean | Date | null | undefined
}

export interface SearchDocument {
  id: string
  type: string
  tenantId?: string
  title: string
  description?: string
  code?: string
  reference?: string
  tags?: string[]
  url?: string
  icon?: string
  metadata?: SearchMetadata
  searchableContent?: string
  boost?: number
  lastModified?: Date
  accessRoles?: string[]
  accessPermissions?: string[]
  
  // Entity-specific fields
  email?: string
  siret?: string
  ville?: string
  codePostal?: string
  famille?: string
  sousFamille?: string
  marque?: string
  statut?: string
  montant?: number
}

// Elasticsearch response types
export interface ElasticsearchHit<T = SearchDocument> {
  _index: string
  _type?: string
  _id: string
  _score?: number
  _source: T
  highlight?: Record<string, string[]>
  sort?: Array<string | number>
}

export interface ElasticsearchSearchResponse<T = SearchDocument> {
  took: number
  timed_out: boolean
  _shards: {
    total: number
    successful: number
    skipped: number
    failed: number
  }
  hits: {
    total: {
      value: number
      relation: 'eq' | 'gte'
    }
    max_score?: number
    hits: ElasticsearchHit<T>[]
  }
  aggregations?: Record<string, ElasticsearchAggregation>
  suggest?: Record<string, ElasticsearchSuggestion[]>
}

export interface ElasticsearchAggregation {
  doc_count?: number
  buckets?: Array<{
    key: string | number
    doc_count: number
    [key: string]: unknown
  }>
  value?: number
  values?: Record<string, number>
  [key: string]: unknown
}

export interface ElasticsearchSuggestion {
  text: string
  offset: number
  length: number
  options: Array<{
    text: string
    _index?: string
    _type?: string
    _id?: string
    _score?: number
    _source?: SearchDocument
  }>
}

// Database query result types
export interface DatabaseRecord {
  id: string
  [key: string]: string | number | boolean | Date | null | undefined
}

export interface PartnerRecord extends DatabaseRecord {
  code: string
  denomination: string
  denomination_commerciale?: string
  email?: string
  siret?: string
  ville?: string
  code_postal?: string
  type: 'CLIENT' | 'SUPPLIER'
  tenant_id?: string
}

export interface ArticleRecord extends DatabaseRecord {
  reference: string
  designation: string
  description?: string
  code_ean?: string
  famille?: string
  sous_famille?: string
  marque?: string
  modele?: string
  tenant_id?: string
}

export interface MaterialRecord extends DatabaseRecord {
  reference?: string
  code?: string
  nom: string
  description?: string
  nuance?: string
  qualite?: string
  type?: string
  forme?: string
  marque?: string
  emplacement?: string
  tenant_id?: string
}

export interface MenuRecord extends DatabaseRecord {
  title: string
  programId: string
  type?: string
  isVisible: boolean
}

export interface UserRecord extends DatabaseRecord {
  email: string
  nom: string
  prenom: string
  acronyme?: string
}

export interface ProjetRecord extends DatabaseRecord {
  code: string
  nom: string
  description?: string
  statut?: string
  tenant_id?: string
}

export interface DevisRecord extends DatabaseRecord {
  numero: string
  objet?: string
  statut?: string
  tenant_id?: string
}

export interface FactureRecord extends DatabaseRecord {
  numero: string
  objet?: string
  statut?: string
  montant_total?: number
  tenant_id?: string
}

export interface CommandeRecord extends DatabaseRecord {
  numero: string
  objet?: string
  statut?: string
  tenant_id?: string
}

export interface SocieteRecord extends DatabaseRecord {
  nom: string
  code: string
  siret?: string
  email?: string
  ville?: string
}

export interface PriceRuleRecord extends DatabaseRecord {
  ruleName: string
  description?: string
  articleFamily?: string
  tenant_id?: string
}

export interface NotificationRecord extends DatabaseRecord {
  title: string
  message?: string
  category?: string
}

export interface QueryBuilderRecord extends DatabaseRecord {
  name: string
  description?: string
  mainTable?: string
  tenant_id?: string
}

// Union type for all possible database records
export type AnyDatabaseRecord = 
  | PartnerRecord
  | ArticleRecord
  | MaterialRecord
  | MenuRecord
  | UserRecord
  | ProjetRecord
  | DevisRecord
  | FactureRecord
  | CommandeRecord
  | SocieteRecord
  | PriceRuleRecord
  | NotificationRecord
  | QueryBuilderRecord
  | DatabaseRecord

// Search statistics types
export interface SearchStatistics {
  totalSearches: number
  averageResponseTime: number
  popularQueries: string[]
  searchEngineStatus: 'healthy' | 'degraded' | 'unavailable'
  indexCounts?: Record<string, number>
  lastIndexUpdate?: Date
}

// Indexing operation types
export interface IndexingDocument {
  type: string
  id: string
  data: AnyDatabaseRecord
}

export interface IndexingBatchResult {
  successful: number
  failed: number
  errors: Array<{
    id: string
    type: string
    error: string
  }>
}

// Search query builder types
export interface ElasticsearchQuery {
  query: {
    bool: {
      must?: Array<Record<string, unknown>>
      filter?: Array<Record<string, unknown>>
      should?: Array<Record<string, unknown>>
      must_not?: Array<Record<string, unknown>>
    }
  }
  highlight?: {
    pre_tags: string[]
    post_tags: string[]
    fields: Record<string, Record<string, unknown>>
  }
  suggest?: Record<string, unknown>
  aggs?: Record<string, unknown>
  from?: number
  size?: number
  sort?: Array<Record<string, unknown>>
}

// Request types from Express
export interface AuthenticatedRequest {
  user?: {
    id: string
    email: string
    tenantId?: string
    societeId?: string
    roles?: string[]
    permissions?: string[]
  }
  tenantId?: string
}
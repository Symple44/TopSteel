import { Injectable, Logger } from '@nestjs/common'
import { SearchResult, ISearchResultFormatter } from '../interfaces/search.interfaces'
import { sanitizeSearchResults } from '../utils/sanitize-highlights'
import { SearchableEntity, calculateRelevanceScore } from '../config/searchable-entities.config'
import { 
  AnyDatabaseRecord, 
  ElasticsearchSearchResponse, 
  ElasticsearchHit,
  SearchMetadata 
} from '../types/search-types'

@Injectable()
export class SearchResultFormatterService implements ISearchResultFormatter {
  private readonly logger = new Logger(SearchResultFormatterService.name)

  formatResults(rawResults: AnyDatabaseRecord[] | ElasticsearchHit[], engine: 'elasticsearch' | 'postgresql'): SearchResult[] {
    if (engine === 'elasticsearch') {
      return this.formatElasticsearchResults(rawResults as ElasticsearchHit[])
    } else {
      return this.formatPostgresResults(rawResults as AnyDatabaseRecord[])
    }
  }

  private formatElasticsearchResults(hits: ElasticsearchHit[]): SearchResult[] {
    return hits.map((hit: ElasticsearchHit) => ({
      type: hit._source.type,
      id: hit._source.id,
      title: hit._source.title,
      description: hit._source.description,
      url: hit._source.url,
      icon: hit._source.icon,
      metadata: hit._source.metadata,
      score: hit._score,
      highlight: hit.highlight
    }))
  }

  private formatPostgresResults(records: AnyDatabaseRecord[]): SearchResult[] {
    return records.map((record: AnyDatabaseRecord) => ({
      type: String(record.type || ''),
      id: String(record.id),
      title: String(record.title || record.nom || record.denomination || record.name || record.id),
      description: record.description ? String(record.description) : undefined,
      url: record.url ? String(record.url) : undefined,
      icon: record.icon ? String(record.icon) : undefined,
      metadata: (record.metadata && typeof record.metadata === 'object' && !(record.metadata instanceof Date)) ? record.metadata as SearchMetadata : undefined,
      score: typeof record.score === 'number' ? record.score : undefined
    }))
  }

  sanitizeResults(results: SearchResult[]): SearchResult[] {
    return sanitizeSearchResults(results)
  }

  extractSuggestions(response: ElasticsearchSearchResponse): string[] {
    if (!response.suggest?.search_suggest) {
      return []
    }
    
    return response.suggest.search_suggest[0]?.options?.map(
      (option: { text: string }) => option.text
    ) || []
  }

  extractFacets(response: ElasticsearchSearchResponse): Record<string, { value: string; count: number }[]> {
    const facets: Record<string, { value: string; count: number }[]> = {}
    
    if (response.aggregations) {
      for (const [key, agg] of Object.entries(response.aggregations)) {
        facets[key] = agg.buckets?.map((bucket) => ({
          value: String(bucket.key),
          count: bucket.doc_count
        })) || []
      }
    }
    
    return facets
  }

  /**
   * Calculate facets from search results (used for PostgreSQL)
   */
  calculateFacetsFromResults(results: SearchResult[]): Record<string, { value: string; count: number }[]> {
    const typeCounts = new Map<string, number>()
    
    for (const result of results) {
      typeCounts.set(result.type, (typeCounts.get(result.type) || 0) + 1)
    }

    return {
      types: Array.from(typeCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count)
    }
  }

  /**
   * Generate title for an entity record
   */
  getRecordTitle(entity: SearchableEntity, record: AnyDatabaseRecord): string {
    switch (entity.type) {
      case 'menu':
        return String(record.title || 'Menu sans titre')
      case 'client':
      case 'fournisseur':
        return String(record.denomination || record.denomination_commerciale || record.code || record.id)
      case 'article':
        return String(record.designation || record.reference || record.id)
      case 'material':
      case 'shared_material':
        return String(record.nom || record.reference || record.code || record.id)
      case 'projet':
        return String(record.nom || record.code || record.id)
      case 'devis':
      case 'facture':
      case 'commande':
        return String(`${entity.displayName} ${record.numero || record.id}`)
      case 'user':
        return String(`${record.prenom || ''} ${record.nom || ''}`.trim() || record.email || record.id)
      case 'societe':
        return String(record.nom || record.code || record.id)
      case 'price_rule':
        return String(record.ruleName || record.id)
      case 'notification':
        return String(record.title || record.id)
      case 'query':
        return String(record.name || record.id)
      default:
        return String(record.title || record.nom || record.name || record.id || 'Sans titre')
    }
  }

  /**
   * Generate description for an entity record
   */
  getRecordDescription(entity: SearchableEntity, record: AnyDatabaseRecord): string | undefined {
    switch (entity.type) {
      case 'client':
      case 'fournisseur':
        const parts = []
        if (record.code) parts.push(record.code)
        if (record.email) parts.push(record.email)
        if (record.ville) parts.push(record.ville)
        return parts.join(' - ')
      case 'article':
        return `${record.reference || ''} - ${record.description || ''}`.trim()
      case 'material':
      case 'shared_material':
        return String(record.description || `${record.type || ''} - ${record.forme || ''}`.trim())
      case 'projet':
        return `${record.code || ''} - ${record.description || ''} [${record.statut || ''}]`.trim()
      case 'devis':
      case 'facture':
      case 'commande':
        return `${record.objet || ''} [${record.statut || ''}]`.trim()
      case 'user':
        return String(record.email || '')
      case 'societe':
        return `${record.siret || ''} - ${record.ville || ''}`.trim()
      default:
        return String(record.description || '')
    }
  }

  /**
   * Extract metadata from an entity record
   */
  extractMetadata(entity: SearchableEntity, record: AnyDatabaseRecord): SearchMetadata {
    const metadata: SearchMetadata = {}
    
    entity.searchableFields.metadata.forEach(field => {
      if (record[field.name] !== undefined && record[field.name] !== null) {
        metadata[field.name] = record[field.name]
      }
    })
    
    return metadata
  }

  /**
   * Format a search result from entity data
   */
  formatEntityResult(entity: SearchableEntity, record: AnyDatabaseRecord, query: string): SearchResult {
    const title = this.getRecordTitle(entity, record)
    const description = this.getRecordDescription(entity, record)
    const score = calculateRelevanceScore(entity, record, query)
    
    let url = entity.urlPattern
    if (url.includes('{id}')) {
      url = url.replace('{id}', record.id)
    }
    if (url.includes('{programId}')) {
      url = url.replace('{programId}', String(record.programId || ''))
    }
    
    return {
      type: entity.type,
      id: record.id,
      title,
      description,
      url,
      icon: entity.icon,
      score,
      metadata: this.extractMetadata(entity, record)
    }
  }
}
import { ApiProperty } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { SearchStatistics } from '../types/search-types'

export class SearchResultDto {
  @ApiProperty({
    description: 'Type of the search result entity',
    example: 'client',
  })
  type: string

  @ApiProperty({
    description: 'Unique identifier of the entity',
    example: '123',
  })
  id: string

  @ApiProperty({
    description: 'Title or name of the entity',
    example: 'ABC Corporation',
  })
  title: string

  @ApiProperty({
    description: 'Description of the entity',
    example: 'Large industrial client specializing in steel fabrication',
    required: false,
  })
  description?: string

  @ApiProperty({
    description: 'URL to view the entity details',
    example: '/partners/clients?id=123',
    required: false,
  })
  url?: string

  @ApiProperty({
    description: 'Icon name for UI display',
    example: 'users',
    required: false,
  })
  icon?: string

  @ApiProperty({
    description: 'Additional metadata about the entity',
    example: { city: 'Paris', type: 'CLIENT' },
    required: false,
  })
  metadata?: Record<string, string | number | boolean | Date | null | undefined>

  @ApiProperty({
    description: 'Relevance score for sorting',
    example: 95.5,
    required: false,
  })
  score?: number

  @ApiProperty({
    description: 'Highlighted search terms in the result',
    required: false,
  })
  highlight?: {
    title?: string[]
    description?: string[]
  }
}

export class SearchResponseDto {
  @ApiProperty({
    description: 'Array of search results',
    type: [SearchResultDto],
  })
  @Type(() => SearchResultDto)
  results: SearchResultDto[]

  @ApiProperty({
    description: 'Total number of results found',
    example: 25,
  })
  total: number

  @ApiProperty({
    description: 'Time taken to execute the search in milliseconds',
    example: 45,
  })
  took: number

  @ApiProperty({
    description: 'Search engine used for the query',
    example: 'elasticsearch',
    enum: ['elasticsearch', 'postgresql'],
  })
  searchEngine: 'elasticsearch' | 'postgresql'

  @ApiProperty({
    description: 'Search suggestions for query completion',
    example: ['client ABC', 'client management', 'client portal'],
    required: false,
  })
  suggestions?: string[]

  @ApiProperty({
    description: 'Faceted search results for filtering',
    required: false,
  })
  facets?: Record<string, { value: string; count: number }[]>
}

export class GlobalSearchResponseDto {
  @ApiProperty({
    description: 'Indicates if the search was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Search results data',
    type: SearchResponseDto,
  })
  @Type(() => SearchResponseDto)
  data: SearchResponseDto

  @ApiProperty({
    description: 'Additional message about the search results',
    example: '25 résultat(s) trouvé(s) en 45ms',
    required: false,
  })
  message?: string
}

export class SuggestionsResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Array of search suggestions',
    example: ['client ABC', 'article XYZ', 'menu gestion'],
    type: [String],
  })
  data: string[]
}

export class SearchStatsResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Search statistics data',
    example: {
      totalSearches: 1250,
      averageResponseTime: 45,
      popularQueries: ['client', 'article', 'commande'],
      searchEngineStatus: 'healthy'
    },
  })
  data: SearchStatistics
}

export class SearchEngineStatusResponseDto {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Search engine status information',
  })
  data: {
    engine: string
    available: boolean
    info?: string
  }
}

export class ReindexResponseDto {
  @ApiProperty({
    description: 'Indicates if the reindex was started successfully',
    example: true,
  })
  success: boolean

  @ApiProperty({
    description: 'Message about the reindex operation',
    example: 'Réindexation démarrée en arrière-plan. Consultez les logs pour le suivi.',
  })
  message: string
}
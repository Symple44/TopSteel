import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Request,
  Logger,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { GlobalSearchService, SearchOptions, SearchResponse } from '../services/global-search.service'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import {
  GlobalSearchDto,
  SuggestionsDto,
  SearchByTypeParamsDto,
  SearchByTypeQueryDto,
  MenuSearchDto,
} from '../dto'
import { AuthenticatedRequest, SearchStatistics } from '../types/search-types'

@Controller('search')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class SearchController {
  private readonly logger = new Logger(SearchController.name)

  constructor(private readonly searchService: GlobalSearchService) {}

  /**
   * Recherche globale
   * GET /api/search/global?q=terme&types=client,article&limit=10
   */
  @Get('global')
  async globalSearch(
    @Query() searchDto: GlobalSearchDto,
    @Request() req?: AuthenticatedRequest
  ): Promise<{
    success: boolean
    data: SearchResponse
    message?: string
  }> {
    try {
      // Récupérer les informations de l'utilisateur
      const user = req?.user
      const tenantId = user?.societeId || user?.tenantId
      const roles = user?.roles || []
      const permissions = user?.permissions || []

      // Préparer les options de recherche
      const searchOptions: SearchOptions = {
        query: searchDto.q,
        types: searchDto.getTypesArray(),
        limit: searchDto.limit,
        offset: searchDto.offset,
        tenantId,
        userId: user?.id,
        roles,
        permissions
      }

      // Log de la recherche
      this.logger.debug(`User ${user?.email} searching for: "${searchDto.q}"`)

      // Effectuer la recherche
      const results = await this.searchService.search(searchOptions)

      return {
        success: true,
        data: results,
        message: `${results.total} résultat(s) trouvé(s) en ${results.took}ms`
      }
    } catch (error) {
      this.logger.error('Search error:', error)
      
      if (error instanceof BadRequestException) {
        throw error
      }

      return {
        success: false,
        data: {
          results: [],
          total: 0,
          took: 0,
          searchEngine: 'postgresql'
        },
        message: 'Une erreur est survenue lors de la recherche'
      }
    }
  }

  /**
   * Obtenir les suggestions de recherche
   * GET /api/search/suggestions?q=terme
   */
  @Get('suggestions')
  async getSuggestions(
    @Query() suggestionsDto: SuggestionsDto,
    @Request() req?: AuthenticatedRequest
  ): Promise<{
    success: boolean
    data: string[]
  }> {
    try {
      const user = req?.user
      const tenantId = user?.societeId || user?.tenantId

      // Recherche limitée pour les suggestions
      const searchOptions: SearchOptions = {
        query: suggestionsDto.q,
        limit: 5,
        offset: 0,
        tenantId,
        userId: user?.id,
        roles: user?.roles || [],
        permissions: user?.permissions || []
      }

      const results = await this.searchService.search(searchOptions)

      // Extraire les titres comme suggestions
      const suggestions = results.results
        .map(r => r.title)
        .filter((v, i, a) => a.indexOf(v) === i) // Unique
        .slice(0, 5)

      // Ajouter les suggestions ElasticSearch si disponibles
      if (results.suggestions && results.suggestions.length > 0) {
        suggestions.push(...results.suggestions)
      }

      return {
        success: true,
        data: suggestions.slice(0, 10) // Maximum 10 suggestions
      }
    } catch (error) {
      this.logger.error('Suggestions error:', error)
      return {
        success: true,
        data: []
      }
    }
  }

  /**
   * Obtenir les statistiques de recherche
   * GET /api/search/stats
   */
  @Get('stats')
  async getSearchStats(): Promise<{
    success: boolean
    data: SearchStatistics
  }> {
    try {
      const stats = await this.searchService.getSearchStatistics()
      
      return {
        success: true,
        data: stats
      }
    } catch (error) {
      this.logger.error('Stats error:', error)
      return {
        success: false,
        data: null
      }
    }
  }

  /**
   * Obtenir le statut du moteur de recherche
   * GET /api/search/status
   */
  @Get('status')
  async getSearchEngineStatus(): Promise<{
    success: boolean
    data: {
      engine: string
      available: boolean
      info?: string
    }
  }> {
    const status = this.searchService.getSearchEngineStatus()
    
    return {
      success: true,
      data: status
    }
  }

  /**
   * Réindexer toutes les données (Admin uniquement)
   * POST /api/search/reindex
   */
  @Post('reindex')
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  async reindexAll(): Promise<{
    success: boolean
    message: string
  }> {
    try {
      this.logger.log('Starting full reindex...')
      
      // Lancer la réindexation en arrière-plan
      this.searchService.reindexAll().catch(error => {
        this.logger.error('Reindex failed:', error)
      })

      return {
        success: true,
        message: 'Réindexation démarrée en arrière-plan. Consultez les logs pour le suivi.'
      }
    } catch (error) {
      this.logger.error('Reindex error:', error)
      return {
        success: false,
        message: 'Erreur lors du démarrage de la réindexation'
      }
    }
  }

  /**
   * Recherche par type spécifique
   * GET /api/search/type/:type?q=terme
   */
  @Get('type/:type')
  async searchByType(
    @Param() params: SearchByTypeParamsDto,
    @Query() queryDto: SearchByTypeQueryDto,
    @Request() req?: AuthenticatedRequest
  ): Promise<{
    success: boolean
    data: SearchResponse
  }> {
    try {
      const user = req?.user

      const searchOptions: SearchOptions = {
        query: queryDto.q,
        types: [params.type],
        limit: queryDto.limit,
        offset: queryDto.offset,
        tenantId: user?.societeId || user?.tenantId,
        userId: user?.id,
        roles: user?.roles || [],
        permissions: user?.permissions || []
      }

      const results = await this.searchService.search(searchOptions)

      return {
        success: true,
        data: results
      }
    } catch (error) {
      this.logger.error('Type search error:', error)
      
      if (error instanceof BadRequestException) {
        throw error
      }

      return {
        success: false,
        data: {
          results: [],
          total: 0,
          took: 0,
          searchEngine: 'postgresql'
        }
      }
    }
  }

  /**
   * Recherche dans les menus uniquement
   * GET /api/search/menus?q=terme
   */
  @Get('menus')
  async searchMenus(
    @Query() menuSearchDto: MenuSearchDto,
    @Request() req?: AuthenticatedRequest
  ): Promise<{
    success: boolean
    data: SearchResponse
  }> {
    try {
      const user = req?.user

      const searchOptions: SearchOptions = {
        query: menuSearchDto.q,
        types: ['menu'],
        limit: 20,
        offset: 0,
        userId: user?.id,
        roles: user?.roles || [],
        permissions: user?.permissions || []
      }

      const results = await this.searchService.search(searchOptions)

      return {
        success: true,
        data: results
      }
    } catch (error) {
      this.logger.error('Menu search error:', error)
      return {
        success: false,
        data: {
          results: [],
          total: 0,
          took: 0,
          searchEngine: 'postgresql'
        }
      }
    }
  }
}
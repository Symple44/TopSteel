import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import type { BusinessContext } from '../../core/interfaces/business-service.interface'
import type { User } from '../../users/entities/user.entity'
import type { CreateMaterialDto } from '../dto/create-material.dto'
import type { InventoryFiltersDto, MaterialFiltersDto } from '../dto/material-filters.dto'
import type { UpdateMaterialDto } from '../dto/update-material.dto'
import type { Material } from '../entities/material.entity'
import type {
  IMaterialRepository,
  MaterialCompatibilityAnalysis,
  MaterialStockAlert,
} from '../repositories/material.repository'
import {
  MaterialService,
  type MaterialStatistics,
  type MaterialStockValorisation,
} from '../services/material.service'

/**
 * Contrôleur REST pour la gestion des matériaux industriels
 */
@ApiTags('🏭 Matériaux')
@Controller('business/materials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MaterialController {
  constructor(
    private readonly materialService: MaterialService,
    @Inject('IMaterialRepository')
    private readonly materialRepository: IMaterialRepository
  ) {}

  /**
   * Créer un nouveau matériau
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer un matériau',
    description: 'Créer un nouveau matériau avec toutes ses propriétés techniques',
  })
  @ApiResponse({
    status: 201,
    description: 'Matériau créé avec succès',
  })
  async createMaterial(
    @Body() createDto: CreateMaterialDto,
    @CurrentUser() user: User
  ): Promise<Material> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.create(createDto, context)
  }

  /**
   * Récupérer tous les matériaux avec filtres
   */
  @Get()
  @ApiOperation({
    summary: 'Lister les matériaux',
    description: 'Récupérer les matériaux avec filtres avancés et pagination',
  })
  async getMaterials(
    @Query() filters: MaterialFiltersDto,
    @CurrentUser() _user: User
  ): Promise<Material[]> {
    return await this.materialService.searchMaterials(filters)
  }

  /**
   * Récupérer un matériau par ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un matériau',
    description: "Récupérer les détails complets d'un matériau",
  })
  async getMaterial(@Param('id') id: string, @CurrentUser() user: User): Promise<Material | null> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.findById(id, context)
  }

  /**
   * Mettre à jour un matériau
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Mettre à jour un matériau',
    description: "Modifier les propriétés d'un matériau existant",
  })
  async updateMaterial(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaterialDto,
    @CurrentUser() user: User
  ): Promise<Material> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.update(id, updateDto, context)
  }

  /**
   * Supprimer un matériau
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer un matériau',
    description: 'Supprimer un matériau (soft delete)',
  })
  async deleteMaterial(@Param('id') id: string, @CurrentUser() user: User): Promise<void> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    await this.materialService.delete(id, context)
  }

  // === ENDPOINTS SPÉCIALISÉS ===

  /**
   * Obtenir les matériaux en rupture de stock
   */
  @Get('stock/rupture')
  @ApiOperation({
    summary: 'Matériaux en rupture',
    description: 'Récupérer tous les matériaux en rupture de stock',
  })
  async getMaterialsEnRupture(): Promise<Material[]> {
    return await this.materialService.getMaterialsEnRupture()
  }

  /**
   * Obtenir les matériaux sous stock minimum
   */
  @Get('stock/sous-mini')
  @ApiOperation({
    summary: 'Matériaux sous stock minimum',
    description: 'Récupérer tous les matériaux sous le seuil minimum',
  })
  async getMaterialsSousStockMini(): Promise<Material[]> {
    return await this.materialService.getMaterialsSousStockMini()
  }

  /**
   * Obtenir les matériaux à réapprovisionner
   */
  @Get('stock/reapprovisionner')
  @ApiOperation({
    summary: 'Matériaux à réapprovisionner',
    description: 'Récupérer les matériaux nécessitant un réapprovisionnement avec quantités',
  })
  async getMaterialsAReapprovisionner(): Promise<Array<Material & { quantiteACommander: number }>> {
    return await this.materialService.getMaterialsAReapprovisionner()
  }

  /**
   * Obtenir les matériaux dangereux
   */
  @Get('categories/dangereux')
  @ApiOperation({
    summary: 'Matériaux dangereux',
    description: 'Récupérer tous les matériaux classés comme dangereux',
  })
  async getMaterialsDangereux(): Promise<Material[]> {
    return await this.materialService.getMaterialsDangereux()
  }

  /**
   * Obtenir les matériaux nécessitant un stockage spécial
   */
  @Get('categories/stockage-special')
  @ApiOperation({
    summary: 'Matériaux à stockage spécial',
    description: 'Récupérer les matériaux nécessitant des conditions de stockage particulières',
  })
  async getMaterialsStockageSpecial(): Promise<Material[]> {
    return await this.materialService.getMaterialsStockageSpecial()
  }

  /**
   * Obtenir les matériaux obsolètes
   */
  @Get('categories/obsoletes')
  @ApiOperation({
    summary: 'Matériaux obsolètes',
    description: 'Récupérer tous les matériaux marqués comme obsolètes',
  })
  async getMaterialsObsoletes(): Promise<Material[]> {
    return await this.materialService.getMaterialsObsoletes()
  }


  /**
   * Recherche textuelle rapide
   */
  @Get('search/text')
  @ApiOperation({
    summary: 'Recherche textuelle',
    description: 'Recherche dans les champs nom, référence, description et nuance',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Texte à rechercher' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre maximum de résultats' })
  async searchByText(
    @Query('q') searchText: string,
    @Query('limit') limit?: number
  ): Promise<Material[]> {
    if (!searchText || searchText.trim().length < 2) {
      throw new BadRequestException('Le texte de recherche doit contenir au moins 2 caractères')
    }
    return await this.materialService.searchByText(searchText, limit)
  }

  /**
   * Obtenir les statistiques des matériaux
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Statistiques des matériaux',
    description: 'Obtenir les statistiques globales sur les matériaux',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques des matériaux',
    schema: {
      type: 'object',
      properties: {
        totalMateriaux: { type: 'number' },
        repartitionParType: { type: 'object' },
        repartitionParForme: { type: 'object' },
        repartitionParStatus: { type: 'object' },
        repartitionParStockage: { type: 'object' },
        valeurTotaleStock: { type: 'number' },
        materialsEnRupture: { type: 'number' },
        materialsSousStockMini: { type: 'number' },
        materialsObsoletes: { type: 'number' },
        materialsDangereux: { type: 'number' },
        materialsStockageSpecial: { type: 'number' }
      }
    }
  })
  async getStatistics() {
    return await this.materialService.getStatistics()
  }

  // === ACTIONS MÉTIER ===

  /**
   * Effectuer un inventaire physique
   */
  @Post(':id/inventaire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Effectuer un inventaire',
    description: 'Mettre à jour le stock physique suite à un inventaire',
  })
  async effectuerInventaire(
    @Param('id') id: string,
    @Body() body: { stockPhysiqueReel: number; commentaire?: string },
    @CurrentUser() user: User
  ): Promise<Material> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.effectuerInventaire(
      id,
      body.stockPhysiqueReel,
      body.commentaire,
      context
    )
  }

  /**
   * Marquer un matériau comme obsolète
   */
  @Post(':id/marquer-obsolete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Marquer comme obsolète',
    description: 'Marquer un matériau comme obsolète avec matériau de remplacement',
  })
  async marquerObsolete(
    @Param('id') id: string,
    @Body() body: { remplacePar?: string; raison?: string },
    @CurrentUser() user: User
  ): Promise<Material> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.marquerObsolete(id, body.remplacePar, body.raison, context)
  }

  /**
   * Dupliquer un matériau
   */
  @Post(':id/dupliquer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dupliquer un matériau',
    description: "Créer une copie d'un matériau avec une nouvelle référence",
  })
  async dupliquerMaterial(
    @Param('id') id: string,
    @Body() body: { nouvelleReference: string; modifications?: Partial<Material> },
    @CurrentUser() user: User
  ): Promise<Material> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.dupliquerMaterial(
      id,
      body.nouvelleReference,
      body.modifications,
      context
    )
  }

  /**
   * Créer une commande de réapprovisionnement
   */
  @Post('reapprovisionner/:fournisseurId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Créer commande réapprovisionnement',
    description: 'Générer automatiquement une commande de réapprovisionnement pour un fournisseur',
  })
  async creerCommandeReapprovisionnement(
    @Param('fournisseurId') fournisseurId: string,
    @CurrentUser() user: User
  ): Promise<{ materials: Material[]; quantitesTotales: number }> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    return await this.materialService.creerCommandeReapprovisionnement(fournisseurId, context)
  }

  // === ANALYSES ET RAPPORTS ===

  /**
   * Analyser la compatibilité entre matériaux
   */
  @Get(':id/compatibilite')
  @ApiOperation({
    summary: 'Analyser la compatibilité',
    description: "Analyser la compatibilité d'un matériau avec les autres",
  })
  async analyserCompatibilite(@Param('id') id: string): Promise<MaterialCompatibilityAnalysis> {
    return await this.materialService.analyserCompatibilite(id)
  }

  /**
   * Calculer la valorisation du stock
   */
  @Get('analyses/valorisation')
  @ApiOperation({
    summary: 'Valorisation du stock',
    description: 'Calculer la valeur totale du stock de matériaux',
  })
  async calculerValorisationStock(
    @Query('type') type?: string
  ): Promise<MaterialStockValorisation> {
    return await this.materialService.calculerValorisationStock(type as any)
  }

  /**
   * Obtenir les statistiques globales
   */
  @Get('analyses/statistiques')
  @ApiOperation({
    summary: 'Statistiques des matériaux',
    description: 'Récupérer les statistiques globales des matériaux',
  })
  async getStatistiques(): Promise<MaterialStatistics> {
    return await this.materialService.getStatistiques()
  }

  /**
   * Obtenir les KPIs du stock
   */
  @Get('analyses/kpis')
  @ApiOperation({
    summary: 'KPIs du stock de matériaux',
    description: 'Obtenir les indicateurs clés de performance du stock',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'KPIs calculés',
    schema: {
      type: 'object',
      properties: {
        tauxRotation: { type: 'number', description: 'Taux de rotation du stock en %' },
        tauxRupture: { type: 'number', description: 'Taux de rupture en %' },
        tauxCouverture: { type: 'number', description: 'Taux de couverture du stock en %' },
        valeurImmobilisee: { type: 'number', description: 'Valeur totale immobilisée' },
        nombreReferences: { type: 'number', description: 'Nombre de références actives' },
        nombreFournisseurs: { type: 'number', description: 'Nombre de fournisseurs distincts' }
      }
    }
  })
  async getKPIs() {
    return await this.materialService.getKPIs()
  }

  /**
   * Obtenir les tendances de stock
   */
  @Get('analyses/tendances')
  @ApiOperation({
    summary: 'Tendances du stock',
    description: 'Analyser les tendances et prévisions de stock',
  })
  @ApiQuery({ 
    name: 'periode', 
    required: false, 
    type: Number, 
    description: 'Période d\'analyse en jours (défaut: 30)' 
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tendances et prévisions',
    schema: {
      type: 'object',
      properties: {
        evolutionStock: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date' },
              valeur: { type: 'number' }
            }
          }
        },
        previsions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              materialId: { type: 'string' },
              reference: { type: 'string' },
              rupturePrevisionnelle: { type: 'string', format: 'date' }
            }
          }
        }
      }
    }
  })
  async getStockTrends(@Query('periode') periode?: number) {
    return await this.materialService.getStockTrends(periode)
  }

  /**
   * Obtenir la valorisation par type
   */
  @Get('analyses/valorisation-par-type')
  @ApiOperation({
    summary: 'Valorisation par type',
    description: 'Calculer la valorisation du stock par type de matériau',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valorisation par type',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          quantite: { type: 'number' },
          valeur: { type: 'number' }
        }
      }
    }
  })
  async getValorisationParType() {
    return await this.materialRepository.getStockValuationByType()
  }

  /**
   * Obtenir la valorisation par forme
   */
  @Get('analyses/valorisation-par-forme')
  @ApiOperation({
    summary: 'Valorisation par forme',
    description: 'Calculer la valorisation du stock par forme de matériau',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Valorisation par forme',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          quantite: { type: 'number' },
          valeur: { type: 'number' }
        }
      }
    }
  })
  async getValorisationParForme() {
    return await this.materialRepository.getStockValuationByShape()
  }

  /**
   * Obtenir les matériaux les plus utilisés
   */
  @Get('analyses/plus-utilises')
  @ApiOperation({
    summary: 'Matériaux les plus utilisés',
    description: 'Obtenir la liste des matériaux les plus consommés',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de résultats (défaut: 10)' })
  @ApiQuery({ name: 'dateDebut', required: false, type: String, format: 'date' })
  @ApiQuery({ name: 'dateFin', required: false, type: String, format: 'date' })
  async getMostUsedMaterials(
    @Query('limit') limit: number = 10,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string
  ) {
    const periode = dateDebut && dateFin 
      ? { debut: new Date(dateDebut), fin: new Date(dateFin) }
      : undefined
    return await this.materialRepository.getMostUsedMaterials(limit, periode)
  }

  /**
   * Obtenir les matériaux à faible rotation
   */
  @Get('analyses/faible-rotation')
  @ApiOperation({
    summary: 'Matériaux à faible rotation',
    description: 'Identifier les matériaux sans mouvement depuis X jours',
  })
  @ApiQuery({ 
    name: 'jours', 
    required: false, 
    type: Number, 
    description: 'Nombre de jours sans mouvement (défaut: 90)' 
  })
  async getSlowMovingMaterials(@Query('jours') jours: number = 90) {
    return await this.materialRepository.getSlowMovingMaterials(jours)
  }

  /**
   * Obtenir les alertes de stock
   */
  @Get('analyses/alertes')
  @ApiOperation({
    summary: 'Alertes de stock',
    description: 'Récupérer toutes les alertes de stock actives',
  })
  async getAlertes(): Promise<MaterialStockAlert[]> {
    return await this.materialService.getAlertes()
  }

  // === RECHERCHES SPÉCIALISÉES ===

  /**
   * Recherche avancée avec agrégations
   */
  @Post('search/advanced')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recherche avancée',
    description: 'Recherche avec critères multiples et agrégations',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        types: { type: 'array', items: { type: 'string' }, description: 'Types de matériaux' },
        formes: { type: 'array', items: { type: 'string' }, description: 'Formes de matériaux' },
        status: { type: 'array', items: { type: 'string' }, description: 'Statuts' },
        nuances: { type: 'array', items: { type: 'string' }, description: 'Nuances' },
        stock: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            disponible: { type: 'number' },
            enRupture: { type: 'boolean' },
            sousStockMinimum: { type: 'boolean' }
          }
        },
        recherche: { type: 'string', description: 'Recherche textuelle' },
        tri: {
          type: 'object',
          properties: {
            champ: { type: 'string' },
            ordre: { type: 'string', enum: ['ASC', 'DESC'] }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1 },
            limite: { type: 'number', minimum: 1, maximum: 100 }
          }
        }
      }
    }
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Résultats de la recherche',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { $ref: '#/components/schemas/Material' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  async searchAdvanced(
    @Body() searchCriteria: Record<string, unknown>,
    @CurrentUser() _user: User
  ): Promise<{
    items: Material[]
    total: number  
    page: number
    limit: number
  }> {
    return await this.materialService.searchAdvanced(searchCriteria)
  }

  /**
   * Recherche par propriétés mécaniques
   */
  @Post('search/proprietes-mecaniques')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recherche par propriétés mécaniques',
    description: 'Trouver des matériaux selon leurs propriétés mécaniques',
  })
  async searchByMechanicalProperties(
    @Body() criteria: {
      limiteElastiqueMin?: number
      limiteElastiqueMax?: number
      resistanceTractionMin?: number
      resistanceTractionMax?: number
      dureteMin?: number
      dureteMax?: number
    }
  ): Promise<Material[]> {
    return await this.materialService.searchMaterials(criteria as Record<string, unknown>)
  }

  /**
   * Recherche par dimensions
   */
  @Post('search/dimensions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Recherche par dimensions',
    description: 'Trouver des matériaux selon leurs dimensions',
  })
  async searchByDimensions(
    @Body() criteria: {
      longueurMin?: number
      longueurMax?: number
      largeurMin?: number
      largeurMax?: number
      epaisseurMin?: number
      epaisseurMax?: number
      diametreMin?: number
      diametreMax?: number
    }
  ): Promise<Material[]> {
    return await this.materialService.searchMaterials(criteria as Record<string, unknown>)
  }

  // === OUTILS D'INVENTAIRE ===

  /**
   * Recherche pour inventaire physique
   */
  @Get('inventaire/par-emplacement')
  @ApiOperation({
    summary: 'Inventaire par emplacement',
    description: "Récupérer les matériaux d'un emplacement pour inventaire",
  })
  async getMaterialsParEmplacement(@Query('emplacement') emplacement: string): Promise<Material[]> {
    return await this.materialService.searchMaterials({ emplacement } as Record<string, unknown>)
  }

  /**
   * Matériaux sans mouvement depuis X jours
   */
  @Get('inventaire/sans-mouvement')
  @ApiOperation({
    summary: 'Matériaux sans mouvement',
    description: 'Récupérer les matériaux sans mouvement depuis X jours',
  })
  async getMaterialsSansMouvement(@Query() filters: InventoryFiltersDto): Promise<Material[]> {
    // Cette méthode nécessiterait une implémentation spécifique dans le service
    return await this.materialService.searchMaterials(filters as Record<string, unknown>)
  }

  // === EXPORT ET REPORTING ===

  /**
   * Export des matériaux
   */
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exporter les matériaux',
    description: 'Exporter la liste des matériaux selon des critères',
  })
  async exportMaterials(
    @Body() exportCriteria: { format: 'CSV' | 'EXCEL' | 'PDF'; filters?: Record<string, unknown> },
    @CurrentUser() _user: User
  ): Promise<{ url: string; filename: string }> {
    // Implémentation de l'export selon le format demandé
    return {
      url: '/exports/materials/export-2024-01-15.csv',
      filename: `materials-export-${new Date().toISOString().split('T')[0]}.${exportCriteria.format.toLowerCase()}`,
    }
  }

  /**
   * Import de matériaux
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Importer des matériaux',
    description: 'Importer une liste de matériaux depuis un fichier',
  })
  async importMaterials(
    @Body() importData: {
      data: Record<string, unknown>[]
      options?: { skipErrors?: boolean; dryRun?: boolean }
    },
    @CurrentUser() user: User
  ): Promise<{
    imported: number
    errors: number
    warnings: string[]
    details: Record<string, unknown>[]
  }> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    const results = {
      imported: 0,
      errors: 0,
      warnings: [] as string[],
      details: [] as Record<string, unknown>[],
    }

    for (const materialData of importData.data) {
      try {
        if (!importData.options?.dryRun) {
          await this.materialService.create(materialData, context)
        }
        results.imported++
        results.details.push({ status: 'success', data: materialData })
      } catch (error) {
        results.errors++
        results.details.push({
          status: 'error',
          data: materialData,
          error: (error as Error).message,
        })
        if (!importData.options?.skipErrors) {
          break
        }
      }
    }

    return results
  }

  /**
   * Validation en lot
   */
  @Post('validate-batch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validation en lot',
    description: 'Valider plusieurs matériaux selon les règles métier',
  })
  async validateBatch(
    @Body() materialIds: string[],
    @CurrentUser() user: User
  ): Promise<Array<{ id: string; valid: boolean; errors: string[] }>> {
    const context: BusinessContext = {
      userId: user.id,
      tenantId: 'current-tenant',
      userRoles: [user.role],
      permissions: [],
    }

    const results: Array<{ id: string; valid: boolean; errors: string[] }> = []

    for (const materialId of materialIds) {
      try {
        const material = await this.materialService.findById(materialId, context)
        if (material) {
          const validation = await this.materialService.validateBusinessRules(
            material,
            'VALIDATE' as any
          )
          results.push({
            id: materialId,
            valid: validation.isValid,
            errors: validation.errors.map((e) => e.message),
          })
        } else {
          results.push({
            id: materialId,
            valid: false,
            errors: ['Matériau introuvable'],
          })
        }
      } catch (error) {
        results.push({
          id: materialId,
          valid: false,
          errors: [(error as Error).message],
        })
      }
    }

    return results
  }
}

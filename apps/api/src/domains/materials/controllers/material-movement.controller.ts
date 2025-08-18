import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiProperty,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Transform, Type } from 'class-transformer'
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import {
  type ICreateMaterialMovement,
  type IMaterialMovement,
  type IMaterialMovementFilters,
  type IMaterialTraceabilityInfo,
  type IMaterialTransformationInfo,
  MaterialMovementPriority,
  MaterialMovementReason,
  MaterialMovementStatus,
  MaterialMovementType,
} from '../interfaces/material-movement.interface'
import type { MaterialMovementService } from '../services/material-movement.service'

/**
 * DTO pour les informations de traçabilité
 */
export class TraceabilityDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroLot?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroSerie?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  certificatMatiere?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroCoulee?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fournisseurOrigine?: string
}

/**
 * DTO pour créer un mouvement de matériau
 */
export class CreateMaterialMovementDto implements Partial<ICreateMaterialMovement> {
  @ApiProperty({ description: 'ID du matériau' })
  @IsUUID()
  materialId: string

  @ApiProperty({ enum: MaterialMovementType })
  @IsEnum(MaterialMovementType)
  type: MaterialMovementType

  @ApiProperty({ enum: MaterialMovementReason })
  @IsEnum(MaterialMovementReason)
  motif: MaterialMovementReason

  @ApiProperty({ description: 'Quantité du mouvement', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantite: number

  @ApiProperty({ enum: MaterialMovementPriority, required: false })
  @IsOptional()
  @IsEnum(MaterialMovementPriority)
  priorite?: MaterialMovementPriority

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurUnitaire?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateMovement?: Date

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  datePrevue?: Date

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emplacementSource?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  emplacementDestination?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zoneSource?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  zoneDestination?: string

  @ApiProperty({ type: TraceabilityDto, required: false })
  @IsOptional()
  @ValidateNested()
  @Type(() => TraceabilityDto)
  tracabilite?: Partial<IMaterialTraceabilityInfo>

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  transformation?: Partial<IMaterialTransformationInfo>

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  documentSourceId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  typeDocumentSource?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroDocumentSource?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  projetId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  commandeId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  ordreFabricationId?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  controleQualite?: {
    effectue: boolean
    conforme?: boolean
    commentaires?: string
    mesures?: Record<string, number>
  }

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  metadonnees?: Record<string, unknown>
}

/**
 * DTO pour filtrer les mouvements
 */
export class FilterMaterialMovementsDto implements Partial<IMaterialMovementFilters> {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  materialIds?: string[]

  @ApiProperty({ enum: MaterialMovementType, isArray: true, required: false })
  @IsOptional()
  @IsEnum(MaterialMovementType, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  types?: MaterialMovementType[]

  @ApiProperty({ enum: MaterialMovementReason, isArray: true, required: false })
  @IsOptional()
  @IsEnum(MaterialMovementReason, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  motifs?: MaterialMovementReason[]

  @ApiProperty({ enum: MaterialMovementStatus, isArray: true, required: false })
  @IsOptional()
  @IsEnum(MaterialMovementStatus, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: MaterialMovementStatus[]

  @ApiProperty({ enum: MaterialMovementPriority, isArray: true, required: false })
  @IsOptional()
  @IsEnum(MaterialMovementPriority, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  priorites?: MaterialMovementPriority[]

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateDebut?: Date

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dateFin?: Date

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  projetIds?: string[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID('4', { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  commandeIds?: string[]

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroLot?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  numeroSerie?: string

  @ApiProperty({ required: false, enum: ['EFFECTUE', 'NON_EFFECTUE', 'CONFORME', 'NON_CONFORME'] })
  @IsOptional()
  @IsEnum(['EFFECTUE', 'NON_EFFECTUE', 'CONFORME', 'NON_CONFORME'])
  controleQualite?: 'EFFECTUE' | 'NON_EFFECTUE' | 'CONFORME' | 'NON_CONFORME'

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  avecTransformation?: boolean

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  recherche?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantiteMin?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantiteMax?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valeurMin?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valeurMax?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  poidsMin?: number

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  poidsMax?: number

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sortBy?: string

  @ApiProperty({ required: false, enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Contrôleur pour les mouvements de matériaux
 */
@ApiTags('Material Movements')
@ApiBearerAuth()
@Controller('materials/movements')
@UseGuards(JwtAuthGuard)
export class MaterialMovementController {
  private readonly logger = new Logger(MaterialMovementController.name)

  constructor(private readonly materialMovementService: MaterialMovementService) {}

  /**
   * Créer un nouveau mouvement de matériau
   */
  @Post()
  @ApiOperation({ summary: 'Créer un mouvement de matériau' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Mouvement créé avec succès',
    type: Object,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides ou stock insuffisant',
  })
  async createMovement(
    @Body() dto: CreateMaterialMovementDto,
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: any
  ): Promise<IMaterialMovement> {
    this.logger.log(`Creating material movement for material ${dto.materialId} by user ${user.id}`)

    return await this.materialMovementService.createMovement({
      ...dto,
      tenantId,
      utilisateurId: user.id,
      utilisateurNom: `${user.firstName} ${user.lastName}`,
    })
  }

  /**
   * Valider un mouvement
   */
  @Put(':id/validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Valider un mouvement de matériau' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        commentaires: { type: 'string', description: 'Commentaires de validation' },
        updateMaterial: { type: 'boolean', description: 'Mettre à jour le stock du matériau' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mouvement validé avec succès',
  })
  async validateMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { commentaires?: string; updateMaterial?: boolean },
    @CurrentUser() user: any
  ): Promise<IMaterialMovement> {
    this.logger.log(`Validating movement ${id} by user ${user.id}`)

    return await this.materialMovementService.validateMovement(
      id,
      user.id,
      `${user.firstName} ${user.lastName}`,
      body
    )
  }

  /**
   * Traiter un mouvement validé
   */
  @Put(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traiter un mouvement validé' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  @ApiQuery({ name: 'skipValidation', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mouvement traité avec succès',
  })
  async processMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force') force?: boolean,
    @Query('skipValidation') skipValidation?: boolean
  ): Promise<IMaterialMovement> {
    this.logger.log(`Processing movement ${id}`)

    return await this.materialMovementService.processMovement(id, {
      forceProcess: force,
      skipValidation,
    })
  }

  /**
   * Annuler un mouvement
   */
  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un mouvement de matériau' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motif: { type: 'string', description: "Motif d'annulation" },
        reverseStock: {
          type: 'boolean',
          description: 'Inverser le stock si le mouvement était terminé',
        },
      },
      required: ['motif'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mouvement annulé avec succès',
  })
  async cancelMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { motif: string; reverseStock?: boolean },
    @CurrentUser() user: any
  ): Promise<IMaterialMovement> {
    this.logger.log(`Cancelling movement ${id}: ${body.motif}`)

    return await this.materialMovementService.cancelMovement(id, body.motif, {
      reverseStock: body.reverseStock,
      utilisateurId: user.id,
      utilisateurNom: `${user.firstName} ${user.lastName}`,
    })
  }

  /**
   * Rechercher les mouvements avec filtres
   */
  @Get()
  @ApiOperation({ summary: 'Rechercher les mouvements de matériaux' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Liste des mouvements',
    schema: {
      type: 'object',
      properties: {
        items: { type: 'array', items: { type: 'object' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
  })
  async findMovements(
    @Query() filters: FilterMaterialMovementsDto,
    @CurrentTenant() tenantId: string
  ): Promise<{
    items: IMaterialMovement[]
    total: number
    page: number
    limit: number
  }> {
    return await this.materialMovementService.findMovements({
      ...filters,
      tenantId,
    })
  }

  /**
   * Obtenir l'historique des mouvements d'un matériau
   */
  @Get('material/:materialId')
  @ApiOperation({ summary: "Obtenir l'historique des mouvements d'un matériau" })
  @ApiParam({ name: 'materialId', description: 'ID du matériau' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeAnnule', required: false, type: Boolean })
  @ApiQuery({ name: 'dateDebut', required: false, type: Date })
  @ApiQuery({ name: 'dateFin', required: false, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historique des mouvements',
  })
  async getMaterialMovementHistory(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Query('limit') limit?: number,
    @Query('includeAnnule') includeAnnule?: boolean,
    @Query('dateDebut') dateDebut?: Date,
    @Query('dateFin') dateFin?: Date
  ): Promise<IMaterialMovement[]> {
    return await this.materialMovementService.getMaterialMovementHistory(materialId, {
      limit,
      includeAnnule,
      dateDebut,
      dateFin,
    })
  }

  /**
   * Calculer le solde des mouvements pour une période
   */
  @Get('material/:materialId/balance')
  @ApiOperation({ summary: 'Calculer le solde des mouvements pour une période' })
  @ApiParam({ name: 'materialId', description: 'ID du matériau' })
  @ApiQuery({ name: 'dateDebut', required: true, type: Date })
  @ApiQuery({ name: 'dateFin', required: true, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Solde des mouvements',
    schema: {
      type: 'object',
      properties: {
        entrees: { type: 'number' },
        sorties: { type: 'number' },
        transformations: { type: 'number' },
        solde: { type: 'number' },
        valeurTotale: { type: 'number' },
        mouvements: { type: 'number' },
      },
    },
  })
  async calculatePeriodBalance(
    @Param('materialId', ParseUUIDPipe) materialId: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string
  ): Promise<{
    entrees: number
    sorties: number
    transformations: number
    solde: number
    valeurTotale: number
    mouvements: number
  }> {
    return await this.materialMovementService.calculatePeriodBalance(
      materialId,
      new Date(dateDebut),
      new Date(dateFin)
    )
  }

  /**
   * Obtenir les statistiques des mouvements
   */
  @Get('statistics')
  @ApiOperation({ summary: 'Obtenir les statistiques des mouvements' })
  @ApiQuery({ name: 'dateDebut', required: false, type: Date })
  @ApiQuery({ name: 'dateFin', required: false, type: Date })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistiques des mouvements',
  })
  async getMovementStatistics(
    @CurrentTenant() tenantId: string,
    @Query('dateDebut') dateDebut?: Date,
    @Query('dateFin') dateFin?: Date
  ) {
    const periode = dateDebut && dateFin ? { dateDebut, dateFin } : undefined
    return await this.materialMovementService.getMovementStatistics(tenantId, periode)
  }

  /**
   * Obtenir un mouvement par son ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un mouvement par son ID' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Détails du mouvement',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mouvement non trouvé',
  })
  async getMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string
  ): Promise<IMaterialMovement> {
    const result = await this.materialMovementService.findMovements({
      materialIds: [id],
      tenantId,
    } as any)

    if (result.items.length === 0) {
      throw new NotFoundException(`Mouvement ${id} non trouvé`)
    }

    return result.items[0]
  }
}

/**
 * Pipe pour parser les dates
 */
import { Injectable, type PipeTransform } from '@nestjs/common'

@Injectable()
class ParseDatePipe implements PipeTransform {
  transform(value: any): Date {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide')
    }
    return date
  }
}

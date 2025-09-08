import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../auth/security/guards/jwt-auth.guard'
import {
  type IStockMovement,
  type IStockMovementFilters,
  StockMovementPriority,
  StockMovementReason,
  StockMovementStatus,
  StockMovementType,
} from '../interfaces/stock-movement.interface'
import type { StockMovementService } from '../services/stock-movement.service'

/**
 * DTO pour créer un mouvement de stock
 */
export class CreateStockMovementDto {
  @ApiProperty({ description: "ID de l'article" })
  @IsUUID()
  articleId: string

  @ApiProperty({ enum: StockMovementType })
  @IsEnum(StockMovementType)
  type: StockMovementType

  @ApiProperty({ description: 'Quantité du mouvement', minimum: 0 })
  @IsNumber()
  @Min(0)
  quantite: number

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  unite?: string

  @ApiProperty({ enum: StockMovementReason, required: false })
  @IsOptional()
  @IsEnum(StockMovementReason)
  motif?: StockMovementReason

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentReference?: string

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
  numeroLot?: string

  @ApiProperty({ enum: StockMovementPriority, required: false })
  @IsOptional()
  @IsEnum(StockMovementPriority)
  priorite?: StockMovementPriority
}

/**
 * DTO pour filtrer les mouvements
 */
export class FilterStockMovementsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  articleId?: string

  @ApiProperty({ enum: StockMovementType, required: false })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType

  @ApiProperty({ enum: StockMovementStatus, required: false })
  @IsOptional()
  @IsEnum(StockMovementStatus)
  statut?: StockMovementStatus

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
  @IsString()
  reference?: string

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
 * Contrôleur pour les mouvements de stock
 */
@ApiTags('Stock Movements')
@ApiBearerAuth()
@Controller('inventory/stock-movements')
@UseGuards(JwtAuthGuard)
export class StockMovementController {
  private readonly logger = new Logger(StockMovementController.name)

  constructor(private readonly stockMovementService: StockMovementService) {}

  /**
   * Créer un nouveau mouvement de stock
   */
  @Post()
  @ApiOperation({ summary: 'Créer un mouvement de stock' })
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
    @Body() dto: CreateStockMovementDto,
    @CurrentTenant() _tenantId: string,
    @CurrentUser() user: any
  ): Promise<IStockMovement> {
    this.logger.log(`Creating stock movement for article ${dto.articleId} by user ${user.id}`)

    return await this.stockMovementService.createMovement({
      ...dto,
    })
  }

  /**
   * Traiter un mouvement en attente
   */
  @Put(':id/process')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Traiter un mouvement en attente' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Mouvement traité avec succès',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Mouvement non trouvé',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Le mouvement n'est pas en attente ou stock insuffisant",
  })
  async processMovement(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('force') force?: boolean,
    @Query('skipValidation') skipValidation?: boolean
  ): Promise<IStockMovement> {
    this.logger.log(`Processing movement ${id}`)

    return await this.stockMovementService.processMovement(id, {
      forceProcess: force,
      skipValidation,
    })
  }

  /**
   * Annuler un mouvement
   */
  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler un mouvement de stock' })
  @ApiParam({ name: 'id', description: 'ID du mouvement' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        motif: { type: 'string', description: "Motif d'annulation" },
        reverseStock: {
          type: 'boolean',
          description: 'Inverser le stock si le mouvement était complété',
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
    @Body() body: { motif: string; reverseStock?: boolean }
  ): Promise<IStockMovement> {
    this.logger.log(`Cancelling movement ${id}: ${body.motif}`)

    return await this.stockMovementService.cancelMovement(id, body.motif, {
      reverseStock: body.reverseStock,
    })
  }

  /**
   * Rechercher les mouvements avec filtres
   */
  @Get()
  @ApiOperation({ summary: 'Rechercher les mouvements de stock' })
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
    @Query() filters: FilterStockMovementsDto,
    @CurrentTenant() tenantId: string
  ): Promise<{
    items: IStockMovement[]
    total: number
    page: number
    limit: number
  }> {
    return await this.stockMovementService.findWithFilters({
      ...filters,
      tenantId,
    } as IStockMovementFilters)
  }

  /**
   * Obtenir l'historique des mouvements d'un article
   */
  @Get('article/:articleId')
  @ApiOperation({ summary: "Obtenir l'historique des mouvements d'un article" })
  @ApiParam({ name: 'articleId', description: "ID de l'article" })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'includeAnnule', required: false, type: Boolean })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Historique des mouvements',
  })
  async getArticleMovementHistory(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query('limit') _limit?: number,
    @Query('includeAnnule') _includeAnnule?: boolean
  ): Promise<IStockMovement[]> {
    return await this.stockMovementService.getAllByArticle(articleId)
  }

  /**
   * Calculer le solde des mouvements pour une période
   */
  @Get('article/:articleId/balance')
  @ApiOperation({ summary: 'Calculer le solde des mouvements pour une période' })
  @ApiParam({ name: 'articleId', description: "ID de l'article" })
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
        solde: { type: 'number' },
        mouvements: { type: 'number' },
      },
    },
  })
  async calculatePeriodBalance(
    @Param('articleId', ParseUUIDPipe) articleId: string,
    @Query('dateDebut') dateDebut: string,
    @Query('dateFin') dateFin: string
  ): Promise<{
    entrees: number
    sorties: number
    solde: number
    mouvements: number
  }> {
    return await this.stockMovementService.calculatePeriodBalance(
      articleId,
      new Date(dateDebut),
      new Date(dateFin)
    )
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
  async getMovement(@Param('id', ParseUUIDPipe) id: string): Promise<IStockMovement> {
    return await this.stockMovementService.getById(id)
  }
}

/**
 * Pipe pour parser les dates
 */
import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common'

@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: unknown): Date {
    const date = new Date(value as string | number | Date)
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException('Date invalide')
    }
    return date
  }
}

// Imports manquants
import { ApiProperty } from '@nestjs/swagger'

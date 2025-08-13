import { PriceRuleChannel } from '@erp/entities'
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import type {
  PriceCalculationResult,
  PricingContext,
  PricingEngineService,
} from '../services/pricing-engine.service'
import type { AuthenticatedUser } from '../types/auth.types'

// DTOs
class ArticleContextDto {
  @IsUUID()
  id!: string

  @IsString()
  reference!: string

  @IsString()
  designation!: string

  @IsString()
  @IsOptional()
  famille?: string

  @IsNumber()
  @IsOptional()
  prixVenteHT?: number

  @IsNumber()
  @IsOptional()
  poids?: number

  @IsNumber()
  @IsOptional()
  longueur?: number

  @IsNumber()
  @IsOptional()
  largeur?: number

  @IsNumber()
  @IsOptional()
  hauteur?: number

  @IsString()
  @IsOptional()
  uniteStock?: string

  @IsString()
  @IsOptional()
  uniteVente?: string
}

export class CalculatePriceDto {
  @IsUUID()
  @IsOptional()
  articleId?: string

  @IsString()
  @IsOptional()
  articleReference?: string

  @ValidateNested()
  @Type(() => ArticleContextDto)
  @IsOptional()
  article?: ArticleContextDto

  @IsNumber()
  @IsOptional()
  quantity?: number

  @IsString()
  @IsOptional()
  customerId?: string

  @IsString()
  @IsOptional()
  customerGroup?: string

  @IsString()
  @IsOptional()
  customerEmail?: string

  @IsEnum(PriceRuleChannel)
  @IsOptional()
  channel?: PriceRuleChannel

  @IsString()
  @IsOptional()
  promotionCode?: string
}

class BulkPriceItemDto {
  @IsUUID()
  articleId!: string

  @IsNumber()
  @IsOptional()
  quantity?: number
}

export class BulkCalculatePriceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkPriceItemDto)
  articles!: BulkPriceItemDto[]

  @IsString()
  @IsOptional()
  customerId?: string

  @IsString()
  @IsOptional()
  customerGroup?: string

  @IsEnum(PriceRuleChannel)
  @IsOptional()
  channel?: PriceRuleChannel
}

export class PreviewRuleDto {
  @IsUUID()
  ruleId!: string

  @IsUUID()
  articleId!: string

  @IsNumber()
  @IsOptional()
  quantity?: number

  @IsString()
  @IsOptional()
  customerGroup?: string

  @IsEnum(PriceRuleChannel)
  @IsOptional()
  channel?: PriceRuleChannel
}

@ApiTags('Pricing')
@Controller('pricing')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PricingController {
  private readonly logger = new Logger(PricingController.name)

  constructor(private readonly pricingEngineService: PricingEngineService) {}

  @Post('calculate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Calcule le prix d'un article",
    description: "Applique les règles de prix pour calculer le prix final d'un article",
  })
  @ApiBody({ type: CalculatePriceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prix calculé avec succès',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Données invalides',
  })
  async calculatePrice(
    @Body(ValidationPipe) dto: CalculatePriceDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PriceCalculationResult> {
    this.logger.log(
      `Calcul de prix demandé par ${user.email} pour article ${dto.articleId || dto.articleReference}`
    )

    const context: PricingContext = {
      ...dto,
      societeId: user.societeId || user.currentSocieteId || 'default',
      customerId: dto.customerId || user.id,
      channel: dto.channel || PriceRuleChannel.ERP,
    }

    try {
      const result = await this.pricingEngineService.calculatePrice(context)

      this.logger.log(
        `Prix calculé: ${result.basePrice}€ -> ${result.finalPrice}€ (${result.appliedRules.length} règles appliquées)`
      )

      return result
    } catch (error) {
      this.logger.error('Erreur calcul de prix:', error)
      throw error
    }
  }

  @Post('calculate-bulk')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcule les prix pour plusieurs articles',
    description:
      'Applique les règles de prix pour calculer les prix de plusieurs articles en une seule requête',
  })
  @ApiBody({ type: BulkCalculatePriceDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prix calculés avec succès',
  })
  async calculateBulkPrices(
    @Body(ValidationPipe) dto: BulkCalculatePriceDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<{ results: Array<{ articleId: string; result: PriceCalculationResult }> }> {
    this.logger.log(
      `Calcul de prix en masse demandé par ${user.email} pour ${dto.articles.length} articles`
    )

    const context = {
      societeId: user.societeId || user.currentSocieteId || 'default',
      customerId: dto.customerId || user.id,
      customerGroup: dto.customerGroup,
      channel: dto.channel || PriceRuleChannel.ERP,
    }

    try {
      const results = await this.pricingEngineService.calculateBulkPrices(dto.articles, context)

      // Convertir Map en array pour la réponse JSON
      const resultsArray = Array.from(results.entries()).map(([articleId, result]) => ({
        articleId,
        result,
      }))

      this.logger.log(`Prix calculés pour ${resultsArray.length} articles`)

      return { results: resultsArray }
    } catch (error) {
      this.logger.error('Erreur calcul de prix en masse:', error)
      throw error
    }
  }

  @Post('preview-rule')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Prévisualise l'application d'une règle",
    description: "Simule l'application d'une règle de prix spécifique sur un article",
  })
  @ApiBody({ type: PreviewRuleDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prévisualisation calculée avec succès',
  })
  async previewRule(
    @Body(ValidationPipe) dto: PreviewRuleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PriceCalculationResult> {
    this.logger.log(
      `Prévisualisation règle ${dto.ruleId} sur article ${dto.articleId} par ${user.email}`
    )

    const context = {
      societeId: user.societeId || user.currentSocieteId || 'default',
      quantity: dto.quantity,
      customerGroup: dto.customerGroup,
      channel: dto.channel || PriceRuleChannel.ERP,
    }

    try {
      const result = await this.pricingEngineService.previewRule(dto.ruleId, dto.articleId, context)

      this.logger.log(`Prévisualisation: ${result.basePrice}€ -> ${result.finalPrice}€`)

      return result
    } catch (error) {
      this.logger.error('Erreur prévisualisation règle:', error)
      throw error
    }
  }
}

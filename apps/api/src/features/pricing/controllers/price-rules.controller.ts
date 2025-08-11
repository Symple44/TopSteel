import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Delete,
  Body, 
  Param,
  Query,
  UseGuards, 
  HttpStatus,
  HttpCode,
  ValidationPipe,
  Logger,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common'
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiQuery,
  ApiParam
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Inject } from '@nestjs/common'
import { 
  PriceRule, 
  AdjustmentType, 
  PriceRuleChannel,
  type PricingCondition 
} from '@erp/entities'
import type { AuthenticatedUser } from '../types/auth.types'
import { 
  IsString, 
  IsOptional, 
  IsNumber, 
  IsEnum, 
  IsBoolean,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  Min,
  Max,
  MaxLength
} from 'class-validator'
import { Type } from 'class-transformer'
import { IPriceRuleRepository, PRICE_RULE_REPOSITORY } from '../repositories/price-rule.repository.interface'

// DTOs
class PricingConditionDto implements PricingCondition {
  @IsString()
  type!: 'customer_group' | 'customer_email' | 'customer_code' | 'quantity' | 'date_range' | 'article_reference' | 'article_family' | 'custom'
  
  @IsString()
  operator!: 'equals' | 'in' | 'between' | 'greater_than' | 'less_than' | 'contains' | 'starts_with'
  
  value!: unknown
  
  @IsString()
  @IsOptional()
  field?: string
}

export class CreatePriceRuleDto {
  @IsString()
  @MaxLength(100)
  ruleName!: string
  
  @IsString()
  @IsOptional()
  description?: string
  
  @IsEnum(PriceRuleChannel)
  @IsOptional()
  channel?: PriceRuleChannel
  
  @IsUUID()
  @IsOptional()
  articleId?: string
  
  @IsString()
  @IsOptional()
  articleFamily?: string
  
  @IsEnum(AdjustmentType)
  adjustmentType!: AdjustmentType
  
  @IsNumber()
  adjustmentValue!: number
  
  @IsString()
  @IsOptional()
  adjustmentUnit?: string
  
  @IsString()
  @IsOptional()
  formula?: string
  
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingConditionDto)
  conditions!: PricingConditionDto[]
  
  @IsNumber()
  @Min(0)
  @Max(1000)
  @IsOptional()
  priority?: number
  
  @IsBoolean()
  @IsOptional()
  combinable?: boolean
  
  @IsDateString()
  @IsOptional()
  validFrom?: string
  
  @IsDateString()
  @IsOptional()
  validUntil?: string
  
  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimit?: number
  
  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimitPerCustomer?: number
  
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  customerGroups?: string[]
}

export class UpdatePriceRuleDto extends CreatePriceRuleDto {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}

class ListPriceRulesQueryDto {
  @IsBoolean()
  @IsOptional()
  active?: boolean
  
  @IsEnum(PriceRuleChannel)
  @IsOptional()
  channel?: PriceRuleChannel
  
  @IsUUID()
  @IsOptional()
  articleId?: string
  
  @IsString()
  @IsOptional()
  articleFamily?: string
  
  @IsString()
  @IsOptional()
  search?: string
  
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number
  
  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  @Min(0)
  offset?: number
}

@ApiTags('Price Rules')
@Controller('pricing/rules')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PriceRulesController {
  private readonly logger = new Logger(PriceRulesController.name)
  
  constructor(
    @Inject('PriceRuleRepository')
    private readonly priceRuleRepository: IPriceRuleRepository
  ) {}
  
  @Get()
  @ApiOperation({ 
    summary: 'Liste les règles de prix', 
    description: 'Récupère la liste des règles de prix avec filtres optionnels'
  })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'channel', required: false, enum: PriceRuleChannel })
  @ApiQuery({ name: 'articleId', required: false, type: String })
  @ApiQuery({ name: 'articleFamily', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Liste des règles récupérée avec succès'
  })
  async listRules(
    @Query(ValidationPipe) query: ListPriceRulesQueryDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<{ rules: PriceRule[]; total: number }> {
    // Utiliser la méthode search du repository
    const rules = await this.priceRuleRepository.search({
      societeId: user.societeId || user.currentSocieteId || 'default',
      searchTerm: query.search,
      channel: query.channel,
      isActive: query.active
    })
    
    // Appliquer la pagination manuellement pour l'instant
    const limit = query.limit || 20
    const offset = query.offset || 0
    const paginatedRules = rules.slice(offset, offset + limit)
    
    const total = rules.length
    
    this.logger.log(`${total} règles de prix trouvées pour société ${(user as any).societeId || (user as any).currentSocieteId || 'default'}`)
    
    return { rules: paginatedRules, total }
  }
  
  @Get(':id')
  @ApiOperation({ 
    summary: 'Récupère une règle de prix', 
    description: 'Récupère les détails d\'une règle de prix spécifique'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Règle récupérée avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Règle non trouvée'
  })
  async getRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PriceRule> {
    const rule = await this.priceRuleRepository.findOne({
      where: { 
        id,
        societeId: (user as any).societeId || (user as any).currentSocieteId || 'default'
      }
    })
    
    if (!rule) {
      throw new BadRequestException('Règle de prix non trouvée')
    }
    
    return rule
  }
  
  @Post()
  @Roles('ADMIN', 'SUPER_ADMIN', 'COMMERCIAL_ADMIN')
  @ApiOperation({ 
    summary: 'Crée une nouvelle règle de prix', 
    description: 'Crée une nouvelle règle de tarification'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Règle créée avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Données invalides'
  })
  async createRule(
    @Body(ValidationPipe) dto: CreatePriceRuleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PriceRule> {
    this.logger.log(`Création règle de prix "${dto.ruleName}" par ${user.email}`)
    
    // Créer et sauvegarder la règle
    const savedRule = await this.priceRuleRepository.create({
      ...dto,
      societeId: user.societeId || user.currentSocieteId || 'default',
      channel: dto.channel || PriceRuleChannel.ALL,
      priority: dto.priority || 0,
      combinable: dto.combinable !== false,
      isActive: true,
      usageCount: 0,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      metadata: {
        createdBy: user.email
      }
    } as Partial<PriceRule>)
    
    this.logger.log(`Règle de prix ${savedRule.id} créée avec succès`)
    
    return savedRule
  }
  
  @Put(':id')
  @Roles('ADMIN', 'SUPER_ADMIN', 'COMMERCIAL_ADMIN')
  @ApiOperation({ 
    summary: 'Met à jour une règle de prix', 
    description: 'Modifie une règle de tarification existante'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Règle mise à jour avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Règle non trouvée'
  })
  async updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdatePriceRuleDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<PriceRule> {
    this.logger.log(`Mise à jour règle ${id} par ${user.email}`)
    
    // Vérifier que la règle appartient à la société
    const existingRule = await this.priceRuleRepository.findOne({
      where: { 
        id,
        societeId: (user as any).societeId || (user as any).currentSocieteId || 'default'
      }
    })
    
    if (!existingRule) {
      throw new BadRequestException('Règle de prix non trouvée')
    }
    
    // Mettre à jour via le repository
    const savedRule = await this.priceRuleRepository.update(id, {
      ...dto,
      validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
      validUntil: dto.validUntil ? new Date(dto.validUntil) : undefined,
      metadata: {
        ...existingRule.metadata,
        notes: `Modified by ${user.email} at ${new Date().toISOString()}`
      }
    })
    
    this.logger.log(`Règle de prix ${savedRule.id} mise à jour`)
    
    return savedRule
  }
  
  @Delete(':id')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Supprime une règle de prix', 
    description: 'Supprime définitivement une règle de tarification'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ 
    status: HttpStatus.NO_CONTENT, 
    description: 'Règle supprimée avec succès'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Règle non trouvée'
  })
  async deleteRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<void> {
    this.logger.log(`Suppression règle ${id} par ${user.email}`)
    
    // Vérifier que la règle appartient à la société
    const rule = await this.priceRuleRepository.findOne({
      where: {
        id,
        societeId: (user as any).societeId || (user as any).currentSocieteId || 'default'
      }
    })
    
    if (!rule) {
      throw new BadRequestException('Règle de prix non trouvée')
    }
    
    // Supprimer via le repository
    await this.priceRuleRepository.softDelete(id)
    
    this.logger.log(`Règle de prix ${id} supprimée`)
  }
  
  @Post(':id/toggle')
  @Roles('ADMIN', 'SUPER_ADMIN', 'COMMERCIAL_ADMIN')
  @ApiOperation({ 
    summary: 'Active/désactive une règle', 
    description: 'Change le statut actif/inactif d\'une règle de prix'
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Statut modifié avec succès'
  })
  async toggleRule(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<{ id: string; isActive: boolean }> {
    const rule = await this.priceRuleRepository.findOne({
      where: { 
        id,
        societeId: (user as any).societeId || (user as any).currentSocieteId || 'default'
      }
    })
    
    if (!rule) {
      throw new BadRequestException('Règle de prix non trouvée')
    }
    
    rule.isActive = !rule.isActive
    rule.metadata = {
      ...rule.metadata,
      notes: `Toggled by ${user.email} at ${new Date().toISOString()}`
    }
    
    await this.priceRuleRepository.save(rule)
    
    this.logger.log(`Règle ${id} ${rule.isActive ? 'activée' : 'désactivée'} par ${user.email}`)
    
    return { id: rule.id, isActive: rule.isActive }
  }
}
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
  ParseUUIDPipe,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import {
  SectorPricingService,
  PricingContext,
  PricingResult,
} from '../services/sector-pricing.service'
import {
  SectorCoefficient,
  SectorType,
  CoefficientType,
} from '../entities/sector-coefficient.entity'
import { CustomerSectorAssignment } from '../entities/customer-sector-assignment.entity'
import { TenantGuard } from '../../../infrastructure/security/guards/tenant.guard'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'

// DTOs
export class CreateSectorCoefficientDto {
  sector!: SectorType
  sectorName!: string
  coefficientType!: CoefficientType
  coefficient!: number
  description?: string
  conditions?: any
  parameters?: any
  metadata?: any
  priority?: number
}

export class UpdateSectorCoefficientDto {
  coefficient?: number
  description?: string
  isActive?: boolean
  conditions?: any
  parameters?: any
  metadata?: any
  priority?: number
}

export class AssignCustomerSectorDto {
  customerId!: string
  sector!: SectorType
  customerName?: string
  customerCode?: string
  reason?: string
  validFrom?: Date
  validUntil?: Date
  sectorMetadata?: any
  metadata?: any
}

export class BulkPricingItemDto {
  productId!: string
  basePrice!: number
  quantity!: number
  productCategory?: string
  articleFamily?: string
  weight?: number
  volume?: number
}

export class BulkPricingRequestDto {
  items!: BulkPricingItemDto[]
  customerId?: string
  customerType?: string
  region?: string
  date?: Date
}

export class CalculatePriceDto {
  customerId?: string
  quantity!: number
  basePrice!: number
  productCategory?: string
  articleFamily?: string
  customerType?: string
  region?: string
  date?: Date
  weight?: number
  volume?: number
}

@ApiTags('Sector Pricing')
@ApiBearerAuth()
@Controller('pricing/sectors')
@UseGuards(TenantGuard)
export class SectorPricingController {
  constructor(private readonly sectorPricingService: SectorPricingService) {}

  @Post('coefficients')
  @ApiOperation({ summary: 'Créer un coefficient sectoriel' })
  @ApiResponse({
    status: 201,
    description: 'Coefficient créé avec succès',
    type: SectorCoefficient,
  })
  async createCoefficient(
    @CurrentTenant() tenantId: string,
    @Body() createDto: CreateSectorCoefficientDto
  ): Promise<SectorCoefficient> {
    return await this.sectorPricingService.createSectorCoefficient({
      societeId: tenantId,
      ...createDto,
    })
  }

  @Get('coefficients')
  @ApiOperation({ summary: 'Obtenir tous les coefficients sectoriels' })
  @ApiResponse({ status: 200, description: 'Liste des coefficients', type: [SectorCoefficient] })
  async getCoefficients(
    @CurrentTenant() tenantId: string,
    @Query('sector') sector?: SectorType,
    @Query('coefficientType') coefficientType?: CoefficientType
  ): Promise<SectorCoefficient[]> {
    return await this.sectorPricingService.getSectorCoefficients(tenantId, sector, coefficientType)
  }

  @Put('coefficients/:id')
  @ApiOperation({ summary: 'Mettre à jour un coefficient sectoriel' })
  @ApiResponse({ status: 200, description: 'Coefficient mis à jour', type: SectorCoefficient })
  async updateCoefficient(
    @CurrentTenant() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSectorCoefficientDto
  ): Promise<SectorCoefficient> {
    return await this.sectorPricingService.updateSectorCoefficient(id, tenantId, updateDto)
  }

  @Post('customer-assignments')
  @ApiOperation({ summary: 'Assigner un secteur à un client' })
  @ApiResponse({ status: 201, description: 'Assignation créée', type: CustomerSectorAssignment })
  async assignCustomerSector(
    @CurrentTenant() tenantId: string,
    @Body() assignDto: AssignCustomerSectorDto
  ): Promise<CustomerSectorAssignment> {
    return await this.sectorPricingService.assignCustomerSector(
      tenantId,
      assignDto.customerId,
      assignDto.sector,
      {
        customerName: assignDto.customerName,
        customerCode: assignDto.customerCode,
        reason: assignDto.reason,
        validFrom: assignDto.validFrom,
        validUntil: assignDto.validUntil,
        sectorMetadata: assignDto.sectorMetadata,
        metadata: assignDto.metadata,
      }
    )
  }

  @Get('customer-assignments')
  @ApiOperation({ summary: 'Obtenir les assignations de secteurs clients' })
  @ApiResponse({
    status: 200,
    description: 'Liste des assignations',
    type: [CustomerSectorAssignment],
  })
  async getCustomerAssignments(
    @CurrentTenant() tenantId: string,
    @Query('sector') sector?: SectorType,
    @Query('includeInactive') includeInactive?: boolean
  ): Promise<CustomerSectorAssignment[]> {
    return await this.sectorPricingService.getCustomerSectorAssignments(
      tenantId,
      sector,
      includeInactive === true
    )
  }

  @Get('customer-assignments/:customerId/sector')
  @ApiOperation({ summary: "Obtenir le secteur d'un client" })
  @ApiResponse({ status: 200, description: 'Secteur du client' })
  async getCustomerSector(
    @CurrentTenant() tenantId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string
  ): Promise<{ sector: SectorType | undefined }> {
    const sector = await this.sectorPricingService.getCustomerSector(tenantId, customerId)
    return { sector }
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculer un prix avec coefficients sectoriels' })
  @ApiResponse({ status: 200, description: 'Prix calculé avec détails', type: Object })
  async calculatePrice(
    @CurrentTenant() tenantId: string,
    @Body() calculateDto: CalculatePriceDto
  ): Promise<PricingResult> {
    return await this.sectorPricingService.calculateSectorPrice(tenantId, calculateDto)
  }

  @Post('calculate-bulk')
  @ApiOperation({ summary: 'Calculer des prix en lot avec coefficients sectoriels' })
  @ApiResponse({ status: 200, description: 'Prix calculés pour plusieurs produits' })
  async calculateBulkPricing(
    @CurrentTenant() tenantId: string,
    @Body() bulkDto: BulkPricingRequestDto
  ): Promise<Array<PricingResult & { productId: string }>> {
    return await this.sectorPricingService.calculateBulkPricing(tenantId, bulkDto.items, {
      customerId: bulkDto.customerId,
      customerType: bulkDto.customerType,
      region: bulkDto.region,
      date: bulkDto.date,
    })
  }

  @Post('btp/setup-defaults')
  @ApiOperation({ summary: 'Créer les coefficients BTP par défaut' })
  @ApiResponse({ status: 201, description: 'Coefficients BTP créés', type: [SectorCoefficient] })
  async setupDefaultBTPCoefficients(
    @CurrentTenant() tenantId: string
  ): Promise<SectorCoefficient[]> {
    return await this.sectorPricingService.createDefaultBTPCoefficients(tenantId)
  }

  @Get('sectors')
  @ApiOperation({ summary: 'Obtenir la liste des secteurs disponibles' })
  @ApiResponse({ status: 200, description: 'Liste des secteurs' })
  async getSectors(): Promise<Array<{ value: string; label: string }>> {
    return Object.values(SectorType).map((sector) => ({
      value: sector,
      label: this.getSectorLabel(sector),
    }))
  }

  @Get('coefficient-types')
  @ApiOperation({ summary: 'Obtenir la liste des types de coefficients' })
  @ApiResponse({ status: 200, description: 'Liste des types de coefficients' })
  async getCoefficientTypes(): Promise<Array<{ value: string; label: string }>> {
    return Object.values(CoefficientType).map((type) => ({
      value: type,
      label: this.getCoefficientTypeLabel(type),
    }))
  }

  private getSectorLabel(sector: SectorType): string {
    const labels: Record<SectorType, string> = {
      [SectorType.BTP]: 'Bâtiment et Travaux Publics',
      [SectorType.INDUSTRIE]: 'Industrie',
      [SectorType.AUTOMOBILE]: 'Automobile',
      [SectorType.NAVAL]: 'Naval',
      [SectorType.AERONAUTIQUE]: 'Aéronautique',
      [SectorType.ENERGIE]: 'Énergie',
      [SectorType.AGRICOLE]: 'Agricole',
      [SectorType.ALIMENTAIRE]: 'Alimentaire',
      [SectorType.CHIMIE]: 'Chimie',
      [SectorType.PHARMACEUTIQUE]: 'Pharmaceutique',
      [SectorType.DEFENSE]: 'Défense',
      [SectorType.TRANSPORT]: 'Transport',
      [SectorType.PARTICULIER]: 'Particulier',
    }
    return labels[sector] || sector
  }

  private getCoefficientTypeLabel(type: CoefficientType): string {
    const labels: Record<CoefficientType, string> = {
      [CoefficientType.BASE_PRICE]: 'Prix de base',
      [CoefficientType.MARGIN]: 'Marge',
      [CoefficientType.DISCOUNT]: 'Remise',
      [CoefficientType.TRANSPORT]: 'Transport',
      [CoefficientType.HANDLING]: 'Manutention',
    }
    return labels[type] || type
  }
}

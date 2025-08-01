import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common'
import { CurrentTenant } from '../../../core/common/decorators/current-tenant.decorator'
import { CurrentUser } from '../../../core/common/decorators/current-user.decorator'
import { Roles } from '../../../domains/auth/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import {
  MarketplaceCategory,
  type MarketplaceModule as MarketplaceModuleEntity,
} from '../entities/marketplace-module.entity'
import type { ModuleInstallation } from '../entities/module-installation.entity'
import type { ModuleRating } from '../entities/module-rating.entity'
import type {
  CreateModuleDto,
  InstallModuleDto,
  MarketplaceService,
  ModuleSearchFilters,
  UpdateModuleDto,
} from '../services/marketplace.service'

export interface RateModuleDto {
  rating: number
  comment?: string
}

@Controller('marketplace')
@UseGuards(JwtAuthGuard)
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  // ===== CATALOGUE DE MODULES =====

  @Get('modules')
  async getModules(
    @Query('category') category?: MarketplaceCategory,
    @Query('query') query?: string,
    @Query('publisher') publisher?: string,
    @Query('minRating') minRating?: number,
    @Query('isFree') isFree?: boolean,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number
  ): Promise<MarketplaceModuleEntity[]> {
    const filters: ModuleSearchFilters = {
      category,
      query,
      publisher,
      minRating,
      isFree,
      priceRange:
        minPrice !== undefined || maxPrice !== undefined
          ? { min: minPrice, max: maxPrice }
          : undefined,
    }

    return await this.marketplaceService.findAllModules(filters)
  }

  @Get('modules/:id')
  async getModule(@Param('id') id: string): Promise<MarketplaceModuleEntity> {
    return await this.marketplaceService.findModuleById(id)
  }

  @Get('categories')
  getCategories(): { value: MarketplaceCategory; label: string; description: string }[] {
    return [
      {
        value: MarketplaceCategory.HR,
        label: 'Ressources Humaines',
        description: 'Recrutement, gestion du personnel, évaluations',
      },
      {
        value: MarketplaceCategory.PROCUREMENT,
        label: 'Achats & Approvisionnement',
        description: 'Optimisation des achats, gestion fournisseurs',
      },
      {
        value: MarketplaceCategory.ANALYTICS,
        label: 'Analytique & BI',
        description: 'Tableaux de bord, reporting, analyses',
      },
      {
        value: MarketplaceCategory.INTEGRATION,
        label: 'Intégrations',
        description: 'Connecteurs ERP, APIs externes',
      },
      {
        value: MarketplaceCategory.QUALITY,
        label: 'Qualité',
        description: 'Conformité, certifications, audits',
      },
      {
        value: MarketplaceCategory.MAINTENANCE,
        label: 'Maintenance',
        description: 'Maintenance prédictive, IoT, GMAO',
      },
      {
        value: MarketplaceCategory.FINANCE,
        label: 'Finance',
        description: 'Comptabilité avancée, factoring, analyses financières',
      },
    ]
  }

  // ===== GESTION DES MODULES (ADMIN) =====

  @Post('modules')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async createModule(
    @Body() createDto: CreateModuleDto,
    @CurrentUser('id') userId: string
  ): Promise<MarketplaceModuleEntity> {
    return await this.marketplaceService.createModule(createDto, userId)
  }

  @Put('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async updateModule(
    @Param('id') id: string,
    @Body() updateDto: UpdateModuleDto,
    @CurrentUser('id') userId: string
  ): Promise<MarketplaceModuleEntity> {
    return await this.marketplaceService.updateModule(id, updateDto, userId)
  }

  @Delete('modules/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async deleteModule(@Param('id') id: string): Promise<{ message: string }> {
    await this.marketplaceService.deleteModule(id)
    return { message: 'Module supprimé avec succès' }
  }

  @Post('modules/:id/publish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async publishModule(@Param('id') id: string): Promise<MarketplaceModuleEntity> {
    return await this.marketplaceService.publishModule(id)
  }

  @Post('modules/:id/unpublish')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async unpublishModule(@Param('id') id: string): Promise<MarketplaceModuleEntity> {
    return await this.marketplaceService.unpublishModule(id)
  }

  // ===== INSTALLATION DE MODULES =====

  @Get('installations')
  async getInstalledModules(
    @CurrentTenant() tenantId: string
  ): Promise<ModuleInstallation[]> {
    return await this.marketplaceService.getInstalledModules(tenantId)
  }

  @Get('installations/:moduleId')
  async getModuleInstallation(
    @Param('moduleId') moduleId: string,
    @CurrentTenant() tenantId: string
  ): Promise<ModuleInstallation | null> {
    return await this.marketplaceService.getModuleInstallation(tenantId, moduleId)
  }

  @Post('installations')
  async installModule(
    @Body() installDto: Omit<InstallModuleDto, 'tenantId'>,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string
  ) {
    const fullInstallDto: InstallModuleDto = {
      ...installDto,
      tenantId,
    }

    return await this.marketplaceService.installModule(fullInstallDto, userId)
  }

  @Delete('installations/:moduleId')
  async uninstallModule(
    @Param('moduleId') moduleId: string,
    @CurrentTenant() tenantId: string,
    @CurrentUser('id') userId: string
  ) {
    return await this.marketplaceService.uninstallModule(tenantId, moduleId, userId)
  }

  @Get('modules/:moduleId/installed')
  async isModuleInstalled(
    @Param('moduleId') moduleId: string,
    @CurrentTenant() tenantId: string
  ): Promise<{ installed: boolean }> {
    const installed = await this.marketplaceService.isModuleInstalled(tenantId, moduleId)
    return { installed }
  }

  // ===== ÉVALUATIONS =====

  @Post('modules/:moduleId/ratings')
  async rateModule(
    @Param('moduleId') moduleId: string,
    @Body() rateDto: RateModuleDto,
    @CurrentUser('id') userId: string
  ): Promise<ModuleRating> {
    return await this.marketplaceService.rateModule(
      moduleId,
      userId,
      rateDto.rating,
      rateDto.comment
    )
  }

  @Get('modules/:moduleId/ratings')
  async getModuleRatings(
    @Param('moduleId') moduleId: string,
    @Query('limit') limit?: number
  ): Promise<ModuleRating[]> {
    return await this.marketplaceService.getModuleRatings(moduleId, limit || 10)
  }

  // ===== STATISTIQUES =====

  @Get('stats/overview')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getMarketplaceStats() {
    const modules = await this.marketplaceService.findAllModules()

    const stats = {
      totalModules: modules.length,
      publishedModules: modules.filter((m) => m.isPublished()).length,
      freeModules: modules.filter((m) => m.isFree()).length,
      paidModules: modules.filter((m) => !m.isFree()).length,
      totalDownloads: modules.reduce((sum, m) => sum + m.downloadCount, 0),
      averageRating:
        modules.length > 0
          ? Number(
              (modules.reduce((sum, m) => sum + m.ratingAverage, 0) / modules.length).toFixed(2)
            )
          : 0,
      categoryBreakdown: {} as Record<MarketplaceCategory, number>,
    }

    // Calculer la répartition par catégorie
    Object.values(MarketplaceCategory).forEach((category) => {
      stats.categoryBreakdown[category] = modules.filter((m) => m.category === category).length
    })

    return stats
  }

  @Get('stats/tenant')
  async getTenantStats(@CurrentTenant() tenantId: string) {
    const installations = await this.marketplaceService.getInstalledModulesWithDetails(tenantId)
    
    const stats = {
      totalInstalledModules: installations.length,
      recentInstallations: installations
        .sort((a, b) => (b.installedAt?.getTime() || 0) - (a.installedAt?.getTime() || 0))
        .slice(0, 5),
      categoryBreakdown: {} as Record<MarketplaceCategory, number>,
      oldestInstallation: installations.length > 0 
        ? installations.reduce((oldest, current) => 
            current.installedAt! < oldest.installedAt! ? current : oldest
          ).installedAt
        : null,
      newestInstallation: installations.length > 0
        ? installations.reduce((newest, current) => 
            current.installedAt! > newest.installedAt! ? current : newest
          ).installedAt
        : null
    }

    // Calculer la répartition par catégorie des modules installés
    Object.values(MarketplaceCategory).forEach(category => {
      stats.categoryBreakdown[category] = installations
        .filter(inst => inst.module.category === category).length
    })

    return stats
  }
}

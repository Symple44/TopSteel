import { PrismaService } from '../../../../core/database/prisma/prisma.service'
import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common'
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger'

import { Roles } from '../../decorators/roles.decorator'
import { JwtAuthGuard } from '../../security/guards/jwt-auth.guard'
import { RolesGuard } from '../../security/guards/roles.guard'

// Define ModuleCategory enum
export enum ModuleCategory {
  CORE = 'CORE',
  BUSINESS = 'BUSINESS',
  ADMIN = 'ADMIN',
  REPORTS = 'REPORTS',
}

@ApiTags('Modules')
@Controller('admin/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModuleController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer tous les modules' })
  @ApiQuery({ name: 'includePermissions', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false, enum: ModuleCategory })
  @ApiResponse({ status: HttpStatus.OK, description: 'Liste des modules récupérée avec succès' })
  async findAllModules(
    @Query('includePermissions') includePermissions: string = 'false',
    @Query('category') category?: ModuleCategory
  ) {
    try {
      // Build where clause
      const where: any = { isActive: true }
      if (category) {
        where.category = category
      }

      // Fetch modules (permissions relation removed in simplified schema)
      const modules = await this.prisma.module.findMany({
        where,
        orderBy: [{ label: 'asc' }, { name: 'asc' }],
      })

      // Calculate metadata using raw query for GROUP BY
      const totalByCategory = await this.prisma.$queryRaw<
        Array<{ category: string; count: bigint }>
      >`
        SELECT category, COUNT(*) as count
        FROM modules
        WHERE "is_active" = true
        GROUP BY category
      `

      const categoryStats = totalByCategory.reduce((acc, item) => {
        acc[item.category] = Number(item.count)
        return acc
      }, {} as Record<string, number>)

      return {
        success: true,
        data: modules,
        meta: {
          total: modules.length,
          categories: Object.values(ModuleCategory),
          byCategory: categoryStats,
        },
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur lors de la récupération des modules',
      }
    }
  }

  @Get('categories')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer les catégories de modules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Catégories récupérées avec succès' })
  async getModuleCategories() {
    try {
      const categories = Object.values(ModuleCategory).map((category) => ({
        value: category,
        label: this.getCategoryLabel(category),
        color: this.getCategoryColor(category),
      }))

      return {
        success: true,
        data: categories,
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'Erreur lors de la récupération des catégories',
      }
    }
  }

  private getCategoryLabel(category: ModuleCategory): string {
    const labels = {
      [ModuleCategory.CORE]: 'Système',
      [ModuleCategory.BUSINESS]: 'Métier',
      [ModuleCategory.ADMIN]: 'Administration',
      [ModuleCategory.REPORTS]: 'Rapports',
    }
    return labels[category] || category
  }

  private getCategoryColor(category: ModuleCategory): string {
    const colors = {
      [ModuleCategory.CORE]: 'bg-gray-100 text-gray-800',
      [ModuleCategory.BUSINESS]: 'bg-blue-100 text-blue-800',
      [ModuleCategory.ADMIN]: 'bg-purple-100 text-purple-800',
      [ModuleCategory.REPORTS]: 'bg-green-100 text-green-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }
}

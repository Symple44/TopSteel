import { 
  Controller, 
  Get, 
  Query, 
  HttpStatus,
  UseGuards
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Module, ModuleCategory } from '../entities/module.entity'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { Roles } from '../decorators/roles.decorator'
import { RolesGuard } from '../guards/roles.guard'

@ApiTags('Modules')
@Controller('api/admin/modules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ModuleController {
  constructor(
    @InjectRepository(Module)
    private readonly moduleRepository: Repository<Module>
  ) {}

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
      const queryBuilder = this.moduleRepository.createQueryBuilder('module')
        .where('module.isActive = :isActive', { isActive: true })
        .orderBy('module.category', 'ASC')
        .addOrderBy('module.sortOrder', 'ASC')
        .addOrderBy('module.name', 'ASC')

      if (category) {
        queryBuilder.andWhere('module.category = :category', { category })
      }

      if (includePermissions === 'true') {
        queryBuilder.leftJoinAndSelect('module.permissions', 'permissions')
      }

      const modules = await queryBuilder.getMany()

      // Calculer les métadonnées
      const totalByCategory = await this.moduleRepository
        .createQueryBuilder('module')
        .select('module.category, COUNT(*) as count')
        .where('module.isActive = :isActive', { isActive: true })
        .groupBy('module.category')
        .getRawMany()

      const categoryStats = totalByCategory.reduce((acc, item) => {
        acc[item.module_category] = parseInt(item.count)
        return acc
      }, {})

      return {
        success: true,
        data: modules,
        meta: {
          total: modules.length,
          categories: Object.values(ModuleCategory),
          byCategory: categoryStats
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des modules'
      }
    }
  }

  @Get('categories')
  @Roles('SUPER_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Récupérer les catégories de modules' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Catégories récupérées avec succès' })
  async getModuleCategories() {
    try {
      const categories = Object.values(ModuleCategory).map(category => ({
        value: category,
        label: this.getCategoryLabel(category),
        color: this.getCategoryColor(category)
      }))

      return {
        success: true,
        data: categories
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur lors de la récupération des catégories'
      }
    }
  }

  private getCategoryLabel(category: ModuleCategory): string {
    const labels = {
      [ModuleCategory.CORE]: 'Système',
      [ModuleCategory.BUSINESS]: 'Métier',
      [ModuleCategory.ADMIN]: 'Administration',
      [ModuleCategory.REPORTS]: 'Rapports'
    }
    return labels[category] || category
  }

  private getCategoryColor(category: ModuleCategory): string {
    const colors = {
      [ModuleCategory.CORE]: 'bg-gray-100 text-gray-800',
      [ModuleCategory.BUSINESS]: 'bg-blue-100 text-blue-800',
      [ModuleCategory.ADMIN]: 'bg-purple-100 text-purple-800',
      [ModuleCategory.REPORTS]: 'bg-green-100 text-green-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }
}
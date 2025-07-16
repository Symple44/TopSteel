import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Roles } from '../../common/decorators/roles.decorator'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { UserRole } from '../users/entities/user.entity'
import { SystemParametersService } from './system-parameters.service'
import { 
  CreateSystemParameterDto, 
  UpdateSystemParameterDto, 
  SystemParameterQueryDto 
} from './dto/system-parameter.dto'

@Controller('admin/system-parameters')
@ApiTags('🔧 System Parameters')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class SystemParametersController {
  constructor(private readonly systemParametersService: SystemParametersService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Créer un nouveau paramètre système' })
  @ApiResponse({ status: 201, description: 'Paramètre créé avec succès' })
  async create(@Body() createDto: CreateSystemParameterDto) {
    return this.systemParametersService.create(createDto)
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lister tous les paramètres système' })
  @ApiResponse({ status: 200, description: 'Liste des paramètres récupérée avec succès' })
  async findAll(@Query() query: SystemParameterQueryDto) {
    return this.systemParametersService.findAll(query)
  }

  @Get('by-category')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Récupérer les paramètres groupés par catégorie' })
  @ApiResponse({ status: 200, description: 'Paramètres groupés par catégorie' })
  async getByCategory(@Query('category') category?: string) {
    if (category) {
      return this.systemParametersService.findByCategory(category as any)
    }
    return this.systemParametersService.getParametersByCategory()
  }

  @Get(':key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Récupérer un paramètre par sa clé' })
  @ApiResponse({ status: 200, description: 'Paramètre récupéré avec succès' })
  async findByKey(@Param('key') key: string) {
    return this.systemParametersService.findByKey(key)
  }

  @Patch(':key')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour un paramètre système' })
  @ApiResponse({ status: 200, description: 'Paramètre mis à jour avec succès' })
  async update(
    @Param('key') key: string,
    @Body() updateDto: UpdateSystemParameterDto
  ) {
    return this.systemParametersService.update(key, updateDto)
  }

  @Patch()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Mettre à jour plusieurs paramètres en une fois' })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour avec succès' })
  async updateMultiple(
    @Body() updates: Array<{ key: string; value: string }>
  ) {
    return this.systemParametersService.updateMultiple(updates)
  }

  @Delete(':key')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un paramètre système' })
  @ApiResponse({ status: 204, description: 'Paramètre supprimé avec succès' })
  async remove(@Param('key') key: string) {
    return this.systemParametersService.remove(key)
  }

  // Endpoints publics pour récupérer des valeurs spécifiques (pour l'application)
  @Get('public/company-info')
  @ApiOperation({ summary: 'Récupérer les informations de l\'entreprise' })
  @ApiResponse({ status: 200, description: 'Informations de l\'entreprise' })
  async getCompanyInfo() {
    const [name, address, phone, email, siret, tva] = await Promise.all([
      this.systemParametersService.getStringValue('COMPANY_NAME'),
      this.systemParametersService.getStringValue('COMPANY_ADDRESS'),
      this.systemParametersService.getStringValue('COMPANY_PHONE'),
      this.systemParametersService.getStringValue('COMPANY_EMAIL'),
      this.systemParametersService.getStringValue('COMPANY_SIRET'),
      this.systemParametersService.getStringValue('COMPANY_TVA'),
    ])

    return {
      name,
      address,
      phone,
      email,
      siret,
      tva,
    }
  }

  @Get('public/enums/:category')
  @ApiOperation({ summary: 'Récupérer les énumérations pour une catégorie' })
  @ApiResponse({ status: 200, description: 'Énumérations récupérées avec succès' })
  async getEnums(@Param('category') category: string) {
    const enumMappings: Record<string, string[]> = {
      'project-statuses': await this.systemParametersService.getJsonValue('PROJECT_STATUSES', []),
      'production-statuses': await this.systemParametersService.getJsonValue('PRODUCTION_STATUSES', []),
      'material-categories': await this.systemParametersService.getJsonValue('MATERIAL_CATEGORIES', []),
      'stock-units': await this.systemParametersService.getJsonValue('STOCK_UNITS', []),
      'payment-terms': await this.systemParametersService.getJsonValue('SUPPLIER_PAYMENT_TERMS', []),
    }

    return enumMappings[category] || []
  }
}
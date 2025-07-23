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
  Request,
  BadRequestException,
  ValidationPipe
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../modules/auth/guards/jwt-auth.guard'
import { 
  UiPreferencesReorderableListService,
  CreateReorderableListPreferencesDto,
  UpdateReorderableListPreferencesDto
} from '../services/ui-preferences-reorderable-list.service'

@ApiTags('UI Preferences - Reorderable List')
@ApiBearerAuth()
@Controller('ui-preferences/reorderable-list')
@UseGuards(JwtAuthGuard)
export class UiPreferencesReorderableListController {
  constructor(
    private readonly preferencesService: UiPreferencesReorderableListService
  ) {}

  @Post(':componentId')
  @ApiOperation({ summary: 'Créer des préférences pour un composant ReorderableList' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 201, description: 'Préférences créées avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou préférences déjà existantes' })
  async createPreferences(
    @Param('componentId') componentId: string,
    @Body(ValidationPipe) dto: Omit<CreateReorderableListPreferencesDto, 'user_id' | 'component_id'>,
    @Request() req: any
  ) {
    // Validation du thème si fourni
    if (dto.theme && !this.preferencesService.validateTheme(dto.theme)) {
      throw new BadRequestException('Thème invalide')
    }

    // Validation du layout si fourni
    if (dto.layout && !await this.preferencesService.validateLayout(dto.layout)) {
      throw new BadRequestException('Configuration de layout invalide')
    }

    return await this.preferencesService.createPreferences({
      ...dto,
      user_id: req.user.id,
      component_id: componentId
    })
  }

  @Get(':componentId')
  @ApiOperation({ summary: 'Récupérer les préférences pour un composant ReorderableList' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  async getPreferences(
    @Param('componentId') componentId: string,
    @Request() req: any
  ) {
    return await this.preferencesService.getOrCreatePreferences(req.user.id, componentId)
  }

  @Put(':componentId')
  @ApiOperation({ summary: 'Mettre à jour les préférences pour un composant ReorderableList' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async updatePreferences(
    @Param('componentId') componentId: string,
    @Body(ValidationPipe) dto: UpdateReorderableListPreferencesDto,
    @Request() req: any
  ) {
    // Validation du thème si fourni
    if (dto.theme && !this.preferencesService.validateTheme(dto.theme)) {
      throw new BadRequestException('Thème invalide')
    }

    // Validation du layout si fourni
    if (dto.layout && !await this.preferencesService.validateLayout(dto.layout)) {
      throw new BadRequestException('Configuration de layout invalide')
    }

    return await this.preferencesService.updatePreferences(req.user.id, componentId, dto)
  }

  @Delete(':componentId')
  @ApiOperation({ summary: 'Supprimer les préférences pour un composant ReorderableList' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 200, description: 'Préférences supprimées avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async deletePreferences(
    @Param('componentId') componentId: string,
    @Request() req: any
  ) {
    await this.preferencesService.deletePreferences(req.user.id, componentId)
    return { message: 'Préférences supprimées avec succès' }
  }

  @Get('user/all')
  @ApiOperation({ summary: 'Récupérer toutes les préférences de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  async getUserPreferences(@Request() req: any) {
    return await this.preferencesService.getPreferencesByUser(req.user.id)
  }

  @Post(':componentId/reset')
  @ApiOperation({ summary: 'Réinitialiser les préférences aux valeurs par défaut' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 200, description: 'Préférences réinitialisées avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async resetToDefaults(
    @Param('componentId') componentId: string,
    @Request() req: any
  ) {
    return await this.preferencesService.resetToDefaults(req.user.id, componentId)
  }

  @Get('themes/available')
  @ApiOperation({ summary: 'Récupérer la liste des thèmes disponibles' })
  @ApiResponse({ status: 200, description: 'Thèmes récupérés avec succès' })
  async getAvailableThemes() {
    const themes = this.preferencesService.getAvailableThemes()
    return {
      themes,
      configurations: themes.map(theme => ({
        theme,
        config: this.preferencesService.getThemeConfig(theme)
      }))
    }
  }

  @Get('themes/:theme/config')
  @ApiOperation({ summary: 'Récupérer la configuration pour un thème spécifique' })
  @ApiParam({ name: 'theme', description: 'Nom du thème' })
  @ApiResponse({ status: 200, description: 'Configuration du thème récupérée avec succès' })
  @ApiResponse({ status: 400, description: 'Thème invalide' })
  async getThemeConfig(@Param('theme') theme: string) {
    if (!this.preferencesService.validateTheme(theme)) {
      throw new BadRequestException('Thème invalide')
    }

    return {
      theme,
      config: this.preferencesService.getThemeConfig(theme as any)
    }
  }

  // Endpoints d'administration (pour les admins)
  @Get('admin/component/:componentId')
  @ApiOperation({ summary: '[Admin] Récupérer toutes les préférences pour un composant' })
  @ApiParam({ name: 'componentId', description: 'ID du composant' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  async getComponentPreferences(
    @Param('componentId') componentId: string,
    @Request() req: any
  ) {
    // TODO: Ajouter vérification des permissions admin
    return await this.preferencesService.getPreferencesByComponent(componentId)
  }

  @Post('admin/bulk')
  @ApiOperation({ summary: '[Admin] Créer des préférences en lot' })
  @ApiResponse({ status: 201, description: 'Préférences créées avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async bulkCreatePreferences(
    @Body(ValidationPipe) dto: { preferences: Array<Omit<CreateReorderableListPreferencesDto, 'user_id'> & { user_id: string }> },
    @Request() req: any
  ) {
    // TODO: Ajouter vérification des permissions admin
    
    if (!dto.preferences || !Array.isArray(dto.preferences)) {
      throw new BadRequestException('Le champ "preferences" doit être un tableau')
    }

    // Validation de chaque préférence
    for (const pref of dto.preferences) {
      if (pref.theme && !this.preferencesService.validateTheme(pref.theme)) {
        throw new BadRequestException(`Thème invalide: ${pref.theme}`)
      }
      if (pref.layout && !await this.preferencesService.validateLayout(pref.layout)) {
        throw new BadRequestException(`Configuration de layout invalide pour ${pref.component_id}`)
      }
    }

    const result = await this.preferencesService.bulkCreatePreferences(dto.preferences)
    return {
      message: 'Préférences créées avec succès',
      count: result.length,
      preferences: result
    }
  }
}
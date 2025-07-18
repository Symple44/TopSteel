import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'
import { UserMenuPreferenceService } from '../services/user-menu-preference.service'
import { UserMenuPreference } from '../entities/user-menu-preference.entity'

@ApiTags('User Menu Preferences')
@Controller('user/menu-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMenuPreferenceController {
  constructor(private readonly userMenuPreferenceService: UserMenuPreferenceService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer les préférences de menu de l\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  async getPreferences(@Request() req): Promise<{ success: boolean; data: UserMenuPreference[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)
    
    return {
      success: true,
      data: preferences,
    }
  }

  @Get('selected-pages')
  @ApiOperation({ summary: 'Récupérer les pages sélectionnées' })
  async getSelectedPages(@Request() req): Promise<{ success: boolean; data: string[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)
    
    return {
      success: true,
      data: preferences.filter(p => p.isVisible).map(p => p.menuId),
    }
  }

  @Put('menu-visibility')
  @ApiOperation({ summary: 'Mettre à jour la visibilité d\'un menu' })
  async updateMenuVisibility(
    @Request() req,
    @Body() body: { menuId: string; isVisible: boolean },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateMenuVisibility(userId, body.menuId, body.isVisible)
    
    return {
      success: true,
      data: updated,
    }
  }

  @Post('toggle-page')
  @ApiOperation({ summary: 'Activer/désactiver une page' })
  async togglePage(
    @Request() req,
    @Body() body: { pageId: string },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.togglePage(userId, body.pageId)
    
    return {
      success: true,
      data: updated,
    }
  }

  @Put('menu-order')
  @ApiOperation({ summary: 'Changer l\'ordre d\'un menu' })
  async updateMenuOrder(
    @Request() req,
    @Body() body: { menuId: string; order: number },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateMenuOrder(userId, body.menuId, body.order)
    
    return {
      success: true,
      data: updated,
    }
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour les préférences de menu' })
  async updatePreferences(
    @Request() req,
    @Body() body: { menuId: string; isVisible?: boolean; order?: number; customLabel?: string },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    let updated: UserMenuPreference
    
    if (body.isVisible !== undefined) {
      updated = await this.userMenuPreferenceService.updateMenuVisibility(userId, body.menuId, body.isVisible)
    } else if (body.order !== undefined) {
      updated = await this.userMenuPreferenceService.updateMenuOrder(userId, body.menuId, body.order)
    } else if (body.customLabel !== undefined) {
      updated = await this.userMenuPreferenceService.updatePageCustomization(userId, body.menuId, body.customLabel)
    } else {
      // Si aucune propriété n'est fournie, récupérer les préférences existantes
      const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)
      updated = preferences.find(p => p.menuId === body.menuId) || preferences[0]
    }
    
    return {
      success: true,
      data: updated,
    }
  }

  @Get('menu')
  @ApiOperation({ summary: 'Récupérer le menu personnalisé' })
  async getCustomMenu(@Request() req): Promise<{ success: boolean; data: any[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)
    
    // Construire le menu basé sur les préférences
    const menuItems = preferences
      .filter(p => p.isVisible)
      .sort((a, b) => a.order - b.order)
      .map(preference => ({
        id: preference.menuId,
        title: preference.customLabel || preference.menuId.charAt(0).toUpperCase() + preference.menuId.slice(1).replace('-', ' '),
        href: `/${preference.menuId}`,
        icon: 'FileText',
        isVisible: preference.isVisible,
        order: preference.order,
        children: []
      }))
    
    return {
      success: true,
      data: menuItems,
    }
  }

  @Post('reset')
  @ApiOperation({ summary: 'Réinitialiser les préférences' })
  async resetPreferences(@Request() req): Promise<{ success: boolean; data: UserMenuPreference[] }> {
    const userId = req.user.id
    const reset = await this.userMenuPreferenceService.resetPreferences(userId)
    
    return {
      success: true,
      data: reset,
    }
  }
}
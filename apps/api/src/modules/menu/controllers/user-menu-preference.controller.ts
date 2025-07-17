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
  async getPreferences(@Request() req): Promise<{ success: boolean; data: UserMenuPreference }> {
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
      data: preferences.selectedPages,
    }
  }

  @Put('selected-pages')
  @ApiOperation({ summary: 'Mettre à jour les pages sélectionnées' })
  async updateSelectedPages(
    @Request() req,
    @Body() body: { pages: string[] },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateSelectedPages(userId, body.pages)
    
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

  @Put('mode')
  @ApiOperation({ summary: 'Changer le mode du menu' })
  async updateMenuMode(
    @Request() req,
    @Body() body: { mode: 'standard' | 'custom' },
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateMenuMode(userId, body.mode)
    
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
    
    // TODO: Intégrer avec le service de menu pour construire le menu basé sur les pages sélectionnées
    // Pour l'instant, on retourne les pages sélectionnées sous forme simplifiée
    const menuItems = preferences.selectedPages.map(pageId => ({
      id: pageId,
      title: pageId.charAt(0).toUpperCase() + pageId.slice(1).replace('-', ' '),
      href: `/${pageId}`,
      icon: 'FileText',
      isVisible: true,
      children: []
    }))
    
    return {
      success: true,
      data: menuItems,
    }
  }

  @Post('reset')
  @ApiOperation({ summary: 'Réinitialiser les préférences' })
  async resetPreferences(@Request() req): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const reset = await this.userMenuPreferenceService.resetPreferences(userId)
    
    return {
      success: true,
      data: reset,
    }
  }
}
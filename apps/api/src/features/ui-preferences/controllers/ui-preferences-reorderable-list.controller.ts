import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common'
import { GetUser } from '../../../core/common/decorators/get-user.decorator'
import { AuthGuard } from '../../../infrastructure/security/guards/auth.guard'
import type {
  ReorderableListConfig,
  UIPreferencesReorderableListService,
} from '../services/ui-preferences-reorderable-list.service'

@Controller('api/ui-preferences/reorderable-list')
@UseGuards(AuthGuard)
export class UIPreferencesReorderableListController {
  constructor(private readonly uiPreferencesService: UIPreferencesReorderableListService) {}

  /**
   * GET /api/ui-preferences/reorderable-list/:componentId
   * Récupère la configuration d'un composant pour l'utilisateur connecté
   */
  @Get(':componentId')
  async getConfig(
    @Param('componentId') componentId: string,
    @GetUser('id') userId: string
  ): Promise<ReorderableListConfig | null> {
    return await this.uiPreferencesService.getConfig(userId, componentId)
  }

  /**
   * POST /api/ui-preferences/reorderable-list/:componentId
   * Sauvegarde ou met à jour la configuration d'un composant
   */
  @Post(':componentId')
  async saveConfig(
    @Param('componentId') componentId: string,
    @Body() config: Partial<ReorderableListConfig>,
    @GetUser('id') userId: string
  ): Promise<ReorderableListConfig> {
    return await this.uiPreferencesService.saveConfig(userId, componentId, config)
  }

  /**
   * DELETE /api/ui-preferences/reorderable-list/:componentId
   * Supprime la configuration d'un composant (reset)
   */
  @Delete(':componentId')
  async deleteConfig(
    @Param('componentId') componentId: string,
    @GetUser('id') userId: string
  ): Promise<{ success: boolean }> {
    const deleted = await this.uiPreferencesService.deleteConfig(userId, componentId)
    return { success: deleted }
  }

  /**
   * GET /api/ui-preferences/reorderable-list
   * Récupère toutes les préférences de l'utilisateur connecté
   */
  @Get()
  async getAllUserConfigs(@GetUser('id') userId: string): Promise<ReorderableListConfig[]> {
    return await this.uiPreferencesService.getAllUserConfigs(userId)
  }

  /**
   * POST /api/ui-preferences/reorderable-list/clone
   * Clone les préférences d'un utilisateur vers l'utilisateur connecté
   */
  @Post('clone')
  async cloneUserConfigs(
    @Body() body: { sourceUserId: string },
    @GetUser('id') userId: string
  ): Promise<{ clonedCount: number }> {
    const clonedCount = await this.uiPreferencesService.cloneUserConfigs(body.sourceUserId, userId)
    return { clonedCount }
  }

  /**
   * DELETE /api/ui-preferences/reorderable-list
   * Supprime toutes les préférences de l'utilisateur connecté
   */
  @Delete()
  async deleteAllUserConfigs(@GetUser('id') userId: string): Promise<{ deletedCount: number }> {
    const deletedCount = await this.uiPreferencesService.deleteAllUserConfigs(userId)
    return { deletedCount }
  }

  /**
   * GET /api/ui-preferences/reorderable-list/export
   * Exporte les préférences de l'utilisateur connecté
   */
  @Get('export')
  async exportUserConfigs(@GetUser('id') userId: string): Promise<{ data: string }> {
    const data = await this.uiPreferencesService.exportUserConfigs(userId)
    return { data }
  }

  /**
   * POST /api/ui-preferences/reorderable-list/import
   * Importe les préférences pour l'utilisateur connecté
   */
  @Post('import')
  async importUserConfigs(
    @Body() body: { jsonData: string; overwrite?: boolean },
    @GetUser('id') userId: string
  ): Promise<{ importedCount: number }> {
    const importedCount = await this.uiPreferencesService.importUserConfigs(
      userId,
      body.jsonData,
      body.overwrite
    )
    return { importedCount }
  }
}

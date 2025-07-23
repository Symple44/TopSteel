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
  DatatableHierarchicalPreferencesService,
  CreateHierarchicalPreferencesDto,
  UpdateHierarchicalPreferencesDto,
  CreateHierarchyOrderDto,
  UpdateHierarchyOrderDto
} from '../services/datatable-hierarchical-preferences.service'

@ApiTags('Datatable Hierarchical Preferences')
@ApiBearerAuth()
@Controller('datatable/hierarchical-preferences')
@UseGuards(JwtAuthGuard)
export class DatatableHierarchicalPreferencesController {
  constructor(
    private readonly preferencesService: DatatableHierarchicalPreferencesService
  ) {}

  // Préférences hiérarchiques
  @Post(':tableId')
  @ApiOperation({ summary: 'Créer des préférences hiérarchiques pour une table' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 201, description: 'Préférences créées avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou préférences déjà existantes' })
  async createPreferences(
    @Param('tableId') tableId: string,
    @Body(ValidationPipe) dto: Omit<CreateHierarchicalPreferencesDto, 'user_id' | 'table_id'>,
    @Request() req: any
  ) {
    return await this.preferencesService.createPreferences({
      ...dto,
      user_id: req.user.id,
      table_id: tableId
    })
  }

  @Get(':tableId')
  @ApiOperation({ summary: 'Récupérer les préférences hiérarchiques pour une table' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async getPreferences(
    @Param('tableId') tableId: string,
    @Request() req: any
  ) {
    return await this.preferencesService.getOrCreatePreferences(req.user.id, tableId)
  }

  @Put(':tableId')
  @ApiOperation({ summary: 'Mettre à jour les préférences hiérarchiques pour une table' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 200, description: 'Préférences mises à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async updatePreferences(
    @Param('tableId') tableId: string,
    @Body(ValidationPipe) dto: UpdateHierarchicalPreferencesDto,
    @Request() req: any
  ) {
    return await this.preferencesService.updatePreferences(req.user.id, tableId, dto)
  }

  @Delete(':tableId')
  @ApiOperation({ summary: 'Supprimer les préférences hiérarchiques pour une table' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 200, description: 'Préférences supprimées avec succès' })
  @ApiResponse({ status: 404, description: 'Préférences introuvables' })
  async deletePreferences(
    @Param('tableId') tableId: string,
    @Request() req: any
  ) {
    await this.preferencesService.deletePreferences(req.user.id, tableId)
    return { message: 'Préférences supprimées avec succès' }
  }

  // Ordre hiérarchique
  @Post(':tableId/order')
  @ApiOperation({ summary: 'Créer un ordre hiérarchique pour un élément' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 201, description: 'Ordre créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides ou ordre déjà existant' })
  async createHierarchyOrder(
    @Param('tableId') tableId: string,
    @Body(ValidationPipe) dto: Omit<CreateHierarchyOrderDto, 'user_id' | 'table_id'>,
    @Request() req: any
  ) {
    return await this.preferencesService.createHierarchyOrder({
      ...dto,
      user_id: req.user.id,
      table_id: tableId
    })
  }

  @Get(':tableId/order')
  @ApiOperation({ summary: 'Récupérer tous les ordres hiérarchiques pour une table' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 200, description: 'Ordres récupérés avec succès' })
  async getHierarchyOrders(
    @Param('tableId') tableId: string,
    @Request() req: any
  ) {
    return await this.preferencesService.getHierarchyOrdersByTable(req.user.id, tableId)
  }

  @Get(':tableId/order/:itemId')
  @ApiOperation({ summary: 'Récupérer l\'ordre hiérarchique pour un élément spécifique' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiParam({ name: 'itemId', description: 'ID de l\'élément' })
  @ApiResponse({ status: 200, description: 'Ordre récupéré avec succès' })
  @ApiResponse({ status: 404, description: 'Ordre introuvable' })
  async getHierarchyOrder(
    @Param('tableId') tableId: string,
    @Param('itemId') itemId: string,
    @Request() req: any
  ) {
    const order = await this.preferencesService.getHierarchyOrder(req.user.id, tableId, itemId)
    if (!order) {
      throw new BadRequestException('Ordre hiérarchique introuvable')
    }
    return order
  }

  @Put(':tableId/order/:itemId')
  @ApiOperation({ summary: 'Mettre à jour l\'ordre hiérarchique pour un élément' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiParam({ name: 'itemId', description: 'ID de l\'élément' })
  @ApiResponse({ status: 200, description: 'Ordre mis à jour avec succès' })
  @ApiResponse({ status: 404, description: 'Ordre introuvable' })
  async updateHierarchyOrder(
    @Param('tableId') tableId: string,
    @Param('itemId') itemId: string,
    @Body(ValidationPipe) dto: UpdateHierarchyOrderDto,
    @Request() req: any
  ) {
    return await this.preferencesService.updateHierarchyOrder(req.user.id, tableId, itemId, dto)
  }

  @Delete(':tableId/order/:itemId')
  @ApiOperation({ summary: 'Supprimer l\'ordre hiérarchique pour un élément' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiParam({ name: 'itemId', description: 'ID de l\'élément' })
  @ApiResponse({ status: 200, description: 'Ordre supprimé avec succès' })
  @ApiResponse({ status: 404, description: 'Ordre introuvable' })
  async deleteHierarchyOrder(
    @Param('tableId') tableId: string,
    @Param('itemId') itemId: string,
    @Request() req: any
  ) {
    await this.preferencesService.deleteHierarchyOrder(req.user.id, tableId, itemId)
    return { message: 'Ordre hiérarchique supprimé avec succès' }
  }

  @Put(':tableId/order/bulk')
  @ApiOperation({ summary: 'Mise à jour en lot des ordres hiérarchiques' })
  @ApiParam({ name: 'tableId', description: 'ID de la table' })
  @ApiResponse({ status: 200, description: 'Ordres mis à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async bulkUpdateHierarchyOrder(
    @Param('tableId') tableId: string,
    @Body(ValidationPipe) dto: { orders: Array<{ item_id: string; parent_id?: string | null; display_order: number; level: number; path?: string | null }> },
    @Request() req: any
  ) {
    if (!dto.orders || !Array.isArray(dto.orders)) {
      throw new BadRequestException('Le champ "orders" doit être un tableau')
    }

    await this.preferencesService.bulkUpdateHierarchyOrder(req.user.id, tableId, dto.orders)
    return { message: 'Ordres hiérarchiques mis à jour avec succès', count: dto.orders.length }
  }
}
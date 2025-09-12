import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { CommonDatabase } from '../../../core/common/decorators/tenant.decorator'
import type { SharedMaterial } from '../entities/shared-material.entity'
import type { SharedMaterialService } from '../services/shared-material.service'

@ApiTags('Shared Materials')
@Controller('shared/materials')
@CommonDatabase() // Accède à la base SHARED
export class SharedMaterialController {
  constructor(private readonly sharedMaterialService: SharedMaterialService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les matériaux partagés' })
  @ApiResponse({ status: 200, description: 'Liste des matériaux partagés' })
  async findAll(): Promise<SharedMaterial[]> {
    return this.sharedMaterialService.findAll()
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer un matériau par code' })
  @ApiResponse({ status: 200, description: 'Matériau trouvé' })
  @ApiResponse({ status: 404, description: 'Matériau non trouvé' })
  async findByCode(@Param('code') code: string): Promise<SharedMaterial | null> {
    return this.sharedMaterialService.findByCode(code)
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Récupérer les matériaux par type' })
  @ApiResponse({ status: 200, description: 'Liste des matériaux du type spécifié' })
  async findByType(@Query('type') type: string): Promise<SharedMaterial[]> {
    return this.sharedMaterialService.findByType(type)
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau matériau partagé' })
  @ApiResponse({ status: 201, description: 'Matériau créé avec succès' })
  async create(@Body() materialData: Partial<SharedMaterial>): Promise<SharedMaterial> {
    return this.sharedMaterialService.create(materialData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un matériau partagé' })
  @ApiResponse({ status: 200, description: 'Matériau mis à jour avec succès' })
  async update(
    @Param('id') id: string,
    @Body() materialData: Partial<SharedMaterial>
  ): Promise<SharedMaterial> {
    return this.sharedMaterialService.update(
      id,
      materialData as QueryDeepPartialEntity<SharedMaterial>
    )
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un matériau partagé' })
  @ApiResponse({ status: 200, description: 'Matériau supprimé avec succès' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.sharedMaterialService.delete(id)
  }
}

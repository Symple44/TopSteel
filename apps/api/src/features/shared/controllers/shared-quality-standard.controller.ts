import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { CommonDatabase } from '../../../core/common/decorators/tenant.decorator'
import type { SharedQualityStandard } from '../entities/shared-quality-standard.entity'
import { SharedQualityStandardService } from '../services/shared-quality-standard.service'

@ApiTags('Shared Quality Standards')
@Controller('shared/quality-standards')
@CommonDatabase()
export class SharedQualityStandardController {
  constructor(private readonly sharedQualityStandardService: SharedQualityStandardService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les standards qualité partagés' })
  async findAll(): Promise<SharedQualityStandard[]> {
    return this.sharedQualityStandardService.findAll()
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer un standard par code' })
  async findByCode(@Param('code') code: string): Promise<SharedQualityStandard | null> {
    return this.sharedQualityStandardService.findByCode(code)
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Récupérer les standards par type' })
  async findByType(@Query('type') type: string): Promise<SharedQualityStandard[]> {
    return this.sharedQualityStandardService.findByType(type)
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau standard qualité partagé' })
  async create(
    @Body() standardData: Partial<SharedQualityStandard>
  ): Promise<SharedQualityStandard> {
    return this.sharedQualityStandardService.create(standardData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un standard qualité partagé' })
  async update(
    @Param('id') id: string,
    @Body() standardData: Partial<SharedQualityStandard>
  ): Promise<SharedQualityStandard> {
    return this.sharedQualityStandardService.update(
      id,
      standardData as QueryDeepPartialEntity<SharedQualityStandard>
    )
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un standard qualité partagé' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.sharedQualityStandardService.delete(id)
  }
}

import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SharedProcessService } from '../services/shared-process.service'
import { SharedProcess } from '../entities/shared-process.entity'
import { CommonDatabase } from '../../../common/decorators/tenant.decorator'

@ApiTags('Shared Processes')
@Controller('shared/processes')
@CommonDatabase()
export class SharedProcessController {
  constructor(private readonly sharedProcessService: SharedProcessService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les processus partagés' })
  async findAll(): Promise<SharedProcess[]> {
    return this.sharedProcessService.findAll()
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer un processus par code' })
  async findByCode(@Param('code') code: string): Promise<SharedProcess | null> {
    return this.sharedProcessService.findByCode(code)
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Récupérer les processus par type' })
  async findByType(@Query('type') type: string): Promise<SharedProcess[]> {
    return this.sharedProcessService.findByType(type)
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau processus partagé' })
  async create(@Body() processData: Partial<SharedProcess>): Promise<SharedProcess> {
    return this.sharedProcessService.create(processData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un processus partagé' })
  async update(
    @Param('id') id: string,
    @Body() processData: Partial<SharedProcess>
  ): Promise<SharedProcess> {
    return this.sharedProcessService.update(id, processData)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un processus partagé' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.sharedProcessService.delete(id)
  }
}
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Site, Prisma } from '@prisma/client'
// import { CommonDatabase } from '../../../core/common/decorators/tenant.decorator' // Removed - TypeORM decorator
import { SitesService } from '../services/sites.service'

@ApiTags('Sites')
@Controller('sites')
// @CommonDatabase() // Removed - TypeORM decorator
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les sites' })
  async findAll(): Promise<Site[]> {
    return this.sitesService.findAll()
  }

  @Get('by-societe/:societeId')
  @ApiOperation({ summary: "Récupérer les sites d'une société" })
  async findBySociete(@Param('societeId') societeId: string): Promise<Site[]> {
    return this.sitesService.findBySociete(societeId)
  }

  @Get('principal/:societeId')
  @ApiOperation({ summary: "Récupérer le site principal d'une société" })
  async findPrincipal(@Param('societeId') societeId: string): Promise<Site | null> {
    return this.sitesService.findPrincipal(societeId)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer un site par ID' })
  async findById(@Param('id') id: string): Promise<Site | null> {
    return this.sitesService.findById(id)
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau site' })
  async create(@Body() siteData: Partial<Site>): Promise<Site> {
    return this.sitesService.create(siteData as any)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un site' })
  async update(@Param('id') id: string, @Body() siteData: Partial<Site>): Promise<Site> {
    return this.sitesService.update(id, siteData as any)
  }

  @Put(':id/set-principal/:societeId')
  @ApiOperation({ summary: 'Définir comme site principal' })
  async setPrincipal(
    @Param('id') id: string,
    @Param('societeId') societeId: string
  ): Promise<Site> {
    return this.sitesService.setPrincipal(id, societeId)
  }

  // @Put(':id/activate')
  // @ApiOperation({ summary: 'Activer un site' })
  // async activate(@Param('id') id: string): Promise<Site> {
  //   return this.sitesService.activate(id)
  // }

  // @Put(':id/deactivate')
  // @ApiOperation({ summary: 'Désactiver un site' })
  // async deactivate(@Param('id') id: string): Promise<Site> {
  //   return this.sitesService.deactivate(id)
  // }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un site' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.sitesService.delete(id)
  }
}

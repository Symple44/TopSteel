import { Controller, Get, Post, Put, Delete, Body, Param, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SocietesService } from '../services/societes.service'
import { TenantProvisioningService, TenantProvisioningResult } from '../services/tenant-provisioning.service'
import { Societe } from '../entities/societe.entity'
import { CreateTenantDto } from '../dto/create-tenant.dto'
import { CommonDatabase } from '../../../common/decorators/tenant.decorator'

@ApiTags('Sociétés')
@Controller('societes')
// @CommonDatabase() // Accède à la base AUTH - TEMPORAIREMENT DÉSACTIVÉ POUR DEBUG
export class SocietesController {
  constructor(
    private readonly societesService: SocietesService,
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  @Get('test-simple')
  @ApiOperation({ summary: 'Test simple sans base de données' })
  async testSimple() {
    return { message: 'Test societes controller fonctionne', timestamp: new Date().toISOString() }
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les sociétés' })
  @ApiResponse({ status: 200, description: 'Liste des sociétés' })
  async findAll(): Promise<Societe[]> {
    try {
      console.log('🔍 Début de findAll() dans SocietesController');
      const result = await this.societesService.findAll();
      console.log('✅ findAll() terminé avec succès, résultats:', result?.length || 0);
      return result;
    } catch (error: any) {
      console.error('❌ Erreur dans findAll():', error?.message || error, error?.stack);
      throw error;
    }
  }

  @Get('active')
  @ApiOperation({ summary: 'Récupérer les sociétés actives' })
  @ApiResponse({ status: 200, description: 'Liste des sociétés actives' })
  async findActive(): Promise<Societe[]> {
    return this.societesService.findActive()
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Récupérer les statistiques des sociétés' })
  @ApiResponse({ status: 200, description: 'Statistiques des sociétés' })
  async getStatistics(): Promise<any> {
    return this.societesService.getStatistics()
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une société par ID' })
  @ApiResponse({ status: 200, description: 'Société trouvée' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findById(@Param('id') id: string): Promise<Societe | null> {
    return this.societesService.findById(id)
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer une société par code' })
  @ApiResponse({ status: 200, description: 'Société trouvée' })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async findByCode(@Param('code') code: string): Promise<Societe | null> {
    return this.societesService.findByCode(code)
  }

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle société (sans base de données)' })
  @ApiResponse({ status: 201, description: 'Société créée avec succès' })
  async create(@Body() societeData: Partial<Societe>): Promise<Societe> {
    return this.societesService.create(societeData)
  }

  @Post('provision-tenant')
  @ApiOperation({ 
    summary: 'Créer une nouvelle société avec sa base de données dédiée',
    description: 'Crée une société complète avec provisioning automatique de sa base de données et des migrations'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Société et base de données créées avec succès',
    type: 'object',
    schema: {
      properties: {
        success: { type: 'boolean' },
        databaseName: { type: 'string' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 409, description: 'Société ou base de données existe déjà' })
  async provisionTenant(@Body() createTenantDto: CreateTenantDto): Promise<TenantProvisioningResult> {
    return this.tenantProvisioningService.createTenantWithDatabase(createTenantDto)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour une société' })
  @ApiResponse({ status: 200, description: 'Société mise à jour avec succès' })
  async update(
    @Param('id') id: string,
    @Body() societeData: Partial<Societe>
  ): Promise<Societe> {
    return this.societesService.update(id, societeData)
  }

  @Put(':id/activate')
  @ApiOperation({ summary: 'Activer une société' })
  @ApiResponse({ status: 200, description: 'Société activée avec succès' })
  async activate(@Param('id') id: string): Promise<Societe> {
    return this.societesService.activate(id)
  }

  @Put(':id/suspend')
  @ApiOperation({ summary: 'Suspendre une société' })
  @ApiResponse({ status: 200, description: 'Société suspendue avec succès' })
  async suspend(@Param('id') id: string): Promise<Societe> {
    return this.societesService.suspend(id)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une société (soft delete)' })
  @ApiResponse({ status: 200, description: 'Société supprimée avec succès' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.societesService.delete(id)
  }

  @Delete(':id/destroy-tenant')
  @ApiOperation({ 
    summary: 'Supprimer complètement une société et sa base de données',
    description: 'ATTENTION: Supprime définitivement la société et toutes ses données. Cette action est irréversible!'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Société et base de données supprimées avec succès',
    type: 'object',
    schema: {
      properties: {
        success: { type: 'boolean' },
        databaseName: { type: 'string' },
        message: { type: 'string' },
        error: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Société non trouvée' })
  async destroyTenant(@Param('id') id: string): Promise<TenantProvisioningResult> {
    return this.tenantProvisioningService.deleteTenantWithDatabase(id)
  }
}
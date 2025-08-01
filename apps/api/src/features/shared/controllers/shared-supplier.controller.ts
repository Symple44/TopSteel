import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { CommonDatabase } from '../../../core/common/decorators/tenant.decorator'
import type { SharedSupplier } from '../entities/shared-supplier.entity'
import { SharedSupplierService } from '../services/shared-supplier.service'

@ApiTags('Shared Suppliers')
@Controller('shared/suppliers')
@CommonDatabase()
export class SharedSupplierController {
  constructor(private readonly sharedSupplierService: SharedSupplierService) {}

  @Get()
  @ApiOperation({ summary: 'Récupérer tous les fournisseurs partagés' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs partagés' })
  async findAll(): Promise<SharedSupplier[]> {
    return this.sharedSupplierService.findAll()
  }

  @Get('by-code/:code')
  @ApiOperation({ summary: 'Récupérer un fournisseur par code' })
  async findByCode(@Param('code') code: string): Promise<SharedSupplier | null> {
    return this.sharedSupplierService.findByCode(code)
  }

  @Get('by-type')
  @ApiOperation({ summary: 'Récupérer les fournisseurs par type' })
  async findByType(@Query('type') type: string): Promise<SharedSupplier[]> {
    return this.sharedSupplierService.findByType(type)
  }

  @Post()
  @ApiOperation({ summary: 'Créer un nouveau fournisseur partagé' })
  async create(@Body() supplierData: Partial<SharedSupplier>): Promise<SharedSupplier> {
    return this.sharedSupplierService.create(supplierData)
  }

  @Put(':id')
  @ApiOperation({ summary: 'Mettre à jour un fournisseur partagé' })
  async update(
    @Param('id') id: string,
    @Body() supplierData: Partial<SharedSupplier>
  ): Promise<SharedSupplier> {
    return this.sharedSupplierService.update(id, supplierData)
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un fournisseur partagé' })
  async delete(@Param('id') id: string): Promise<void> {
    return this.sharedSupplierService.delete(id)
  }
}

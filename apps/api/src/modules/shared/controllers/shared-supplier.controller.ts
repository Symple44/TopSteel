import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { SharedSupplierService } from '../services/shared-supplier.service'
import { SharedSupplier } from '../entities/shared-supplier.entity'
import { CommonDatabase } from '../../../common/decorators/tenant.decorator'

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
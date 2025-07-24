import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger'
import { TenantProvisioningService } from '../services/tenant-provisioning.service'

@ApiTags('Provisioning')
@Controller('provisioning')
export class TenantProvisioningController {
  constructor(
    private readonly tenantProvisioningService: TenantProvisioningService,
  ) {}

  @Post('tenant')
  @ApiOperation({ summary: 'Créer une nouvelle société avec tenant' })
  @ApiResponse({ status: 201, description: 'Société créée avec succès' })
  async createTenant(@Body() data: any) {
    try {
      console.log('🚀 Début création tenant:', data);
      
      const result = await this.tenantProvisioningService.createTenantWithDatabase(data);
      
      console.log('✅ Tenant créé avec succès:', result);
      return {
        success: true,
        message: 'Société créée avec succès',
        data: result
      };
    } catch (error: any) {
      console.error('❌ Erreur création tenant:', error?.message || error);
      throw new HttpException(
        {
          success: false,
          message: 'Erreur lors de la création de la société',
          error: error?.message || 'Erreur interne'
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test endpoint provisioning' })
  async test() {
    return {
      success: true,
      message: 'Endpoint provisioning fonctionne',
      timestamp: new Date().toISOString()
    };
  }
}
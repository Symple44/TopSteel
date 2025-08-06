import { Body, Controller, HttpException, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { TenantProvisioningService } from '../services/tenant-provisioning.service'

@ApiTags('Provisioning')
@Controller('provisioning')
export class TenantProvisioningController {
  constructor(private readonly tenantProvisioningService: TenantProvisioningService) {}

  @Post('tenant')
  @ApiOperation({ summary: 'Créer une nouvelle société avec tenant' })
  @ApiResponse({ status: 201, description: 'Société créée avec succès' })
  async createTenant(@Body() data: unknown) {
    try {
      const result = await this.tenantProvisioningService.createTenantWithDatabase(data)
      return {
        success: true,
        message: 'Société créée avec succès',
        data: result,
      }
    } catch (error: unknown) {
      throw new HttpException(
        {
          success: false,
          message: 'Erreur lors de la création de la société',
          error: error?.message || 'Erreur interne',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      )
    }
  }

  @Post('test')
  @ApiOperation({ summary: 'Test endpoint provisioning' })
  async test() {
    return {
      success: true,
      message: 'Endpoint provisioning fonctionne',
      timestamp: new Date().toISOString(),
    }
  }
}

import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards,
  Logger,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiBody } from '@nestjs/swagger'
import { IsString, IsOptional, IsEmail } from 'class-validator'
import { Public } from '../../../core/multi-tenant'
import { Roles } from '../../../core/common/decorators/roles.decorator'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import { RolesGuard } from '../../../domains/auth/security/guards/roles.guard'
import { GlobalUserRole } from '../../../domains/auth/core/constants/roles.constants'
import { SystemParameterPrismaService } from '../../../domains/admin/prisma/system-parameter-prisma.service'

class UpdateCompanyDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsString()
  @IsOptional()
  siret?: string

  @IsString()
  @IsOptional()
  vat?: string

  @IsString()
  @IsOptional()
  address?: string

  @IsString()
  @IsOptional()
  city?: string

  @IsString()
  @IsOptional()
  postalCode?: string

  @IsString()
  @IsOptional()
  country?: string

  @IsString()
  @IsOptional()
  phone?: string

  @IsEmail()
  @IsOptional()
  email?: string

  @IsString()
  @IsOptional()
  website?: string
}

@Controller('admin/company')
@ApiTags('🏢 Company Settings')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class AdminCompanyController {
  private readonly logger = new Logger(AdminCompanyController.name)

  constructor(private readonly systemParameterService: SystemParameterPrismaService) {}

  @Get()
  @Roles(GlobalUserRole.ADMIN, GlobalUserRole.MANAGER)
  @ApiOperation({ summary: 'Get company information' })
  @ApiResponse({ status: 200, description: 'Company information retrieved successfully' })
  async getCompanyInfo() {
    this.logger.log('Fetching company information')

    const keys = [
      'COMPANY_NAME',
      'COMPANY_SIRET',
      'COMPANY_TVA',
      'COMPANY_ADDRESS',
      'COMPANY_CITY',
      'COMPANY_POSTAL_CODE',
      'COMPANY_COUNTRY',
      'COMPANY_PHONE',
      'COMPANY_EMAIL',
      'COMPANY_WEBSITE',
    ]

    const values = await Promise.all(
      keys.map(async (key) => {
        const value = await this.systemParameterService.getValue(key)
        return value || ''
      })
    )

    const [name, siret, vat, address, city, postalCode, country, phone, email, website] = values

    return {
      success: true,
      data: {
        name: name || 'TopSteel',
        siret,
        vat,
        address,
        city,
        postalCode,
        country: country || 'France',
        phone,
        email,
        website,
      },
    }
  }

  @Put()
  @Roles(GlobalUserRole.ADMIN)
  @ApiOperation({ summary: 'Update company information' })
  @ApiBody({ type: UpdateCompanyDto })
  @ApiResponse({ status: 200, description: 'Company information updated successfully' })
  async updateCompanyInfo(@Body() updateDto: UpdateCompanyDto) {
    this.logger.log('Updating company information')

    const updates: Array<{ key: string; value: string }> = []

    const fieldMapping: Record<keyof UpdateCompanyDto, string> = {
      name: 'COMPANY_NAME',
      siret: 'COMPANY_SIRET',
      vat: 'COMPANY_TVA',
      address: 'COMPANY_ADDRESS',
      city: 'COMPANY_CITY',
      postalCode: 'COMPANY_POSTAL_CODE',
      country: 'COMPANY_COUNTRY',
      phone: 'COMPANY_PHONE',
      email: 'COMPANY_EMAIL',
      website: 'COMPANY_WEBSITE',
    }

    for (const [field, paramKey] of Object.entries(fieldMapping)) {
      const value = updateDto[field as keyof UpdateCompanyDto]
      if (value !== undefined) {
        updates.push({ key: paramKey, value })
      }
    }

    // Upsert each parameter
    for (const update of updates) {
      await this.systemParameterService.upsertSystemParameter({
        key: update.key,
        value: update.value,
        description: `Company ${update.key.replace('COMPANY_', '').toLowerCase()}`,
      })
    }

    this.logger.log(`Updated ${updates.length} company parameters`)

    return {
      success: true,
      message: 'Informations de l\'entreprise mises à jour avec succès',
      updatedFields: updates.length,
    }
  }
}

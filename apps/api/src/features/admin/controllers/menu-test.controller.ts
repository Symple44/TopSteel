import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Controller, Get, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { getErrorMessage } from '../../../core/common/utils'
import { Public } from '../../../core/multi-tenant'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'

@ApiTags('Admin - Menu Test')
@Controller('admin/menu-test')
@Public() // Bypass global TenantGuard - JwtAuthGuard handles JWT auth
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class MenuTestController {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  @Get('simple')
  async getSimpleTest() {
    try {
      const configs = await this.prisma.menuConfiguration.findMany({ take: 1 })
      return {
        success: true,
        message: 'Menu entities working!',
        configCount: configs.length,
        data: configs[0] || null,
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : getErrorMessage(error),
        stack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
      }
    }
  }

  @Get('raw-query')
  async getRawQuery() {
    try {
      const result = await this.prisma.$queryRaw<Array<{ id: string; name: string; isActive: boolean }>>`
        SELECT id, name, isactive as "isActive"
        FROM menu_configurations
        LIMIT 1
      `
      return {
        success: true,
        message: 'Raw query working!',
        data: result[0] || null,
      }
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? getErrorMessage(error) : getErrorMessage(error),
      }
    }
  }
}


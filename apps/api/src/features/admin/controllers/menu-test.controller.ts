import { Controller, Get } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { getErrorMessage } from '../../../core/common/utils'
import { MenuConfigurationSimple } from '../entities/menu-configuration-simple.entity'

@Controller('admin/menu-test')
export class MenuTestController {
  constructor(
    @InjectRepository(MenuConfigurationSimple, 'auth')
    private readonly _configRepository: Repository<MenuConfigurationSimple>
  ) {}

  @Get('simple')
  async getSimpleTest() {
    try {
      const configs = await this._configRepository.find({ take: 1 })
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
      const result = await this._configRepository.query(`
        SELECT id, name, isactive as "isActive" 
        FROM menu_configurations 
        LIMIT 1
      `)
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

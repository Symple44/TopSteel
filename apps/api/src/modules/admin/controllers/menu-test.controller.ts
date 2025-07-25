import { Controller, Get } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MenuConfigurationSimple } from '../entities/menu-configuration-simple.entity'

@Controller('admin/menu-test')
export class MenuTestController {
  constructor(
    @InjectRepository(MenuConfigurationSimple, 'auth')
    private readonly configRepository: Repository<MenuConfigurationSimple>,
  ) {}

  @Get('simple')
  async getSimpleTest() {
    try {
      const configs = await this.configRepository.find({ take: 1 })
      return {
        success: true,
        message: 'Menu entities working!',
        configCount: configs.length,
        data: configs[0] || null
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
    }
  }

  @Get('raw-query')
  async getRawQuery() {
    try {
      const result = await this.configRepository.query(`
        SELECT id, name, isactive as "isActive" 
        FROM menu_configurations 
        LIMIT 1
      `)
      return {
        success: true,
        message: 'Raw query working!',
        data: result[0] || null
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}
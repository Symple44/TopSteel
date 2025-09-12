import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { AppService } from './app.service'

@Controller()
@ApiTags('App')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: "Point d'entrée API" })
  getHello(): string {
    return this.appService.getHello()
  }

  @Get('version')
  @ApiOperation({ summary: "Version de l'API" })
  getVersion(): { name: string; version: string; description: string; timestamp: string } {
    return this.appService.getVersion()
  }
}

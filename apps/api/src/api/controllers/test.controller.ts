import { Controller, Get } from '@nestjs/common'

@Controller('test')
export class TestController {
  @Get()
  async test() {
    return { message: 'Test API fonctionne', timestamp: new Date().toISOString() }
  }

  @Get('societes-simple')
  async testSocietes() {
    // Test direct sans passer par le service
    return {
      message: 'Test societes endpoint',
      data: [
        { id: '1', nom: 'Test Societe 1', code: 'TEST1' },
        { id: '2', nom: 'Test Societe 2', code: 'TEST2' },
      ],
    }
  }
}

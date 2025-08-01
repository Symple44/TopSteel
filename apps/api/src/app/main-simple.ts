import { Controller, Get, Logger, Module } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'

@Controller('admin/database')
class TestController {
  @Get('health')
  health() {
    return {
      status: 'OK',
      timestamp: new Date(),
      databases: ['auth', 'shared', 'tenant'],
      message: 'Database health check OK',
    }
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

async function bootstrap() {
  const logger = new Logger('SimpleBootstrap')

  try {
    const app = await NestFactory.create(TestModule, {
      logger: ['error', 'warn', 'log'],
    })

    // Configuration CORS simple
    app.enableCors({
      origin: 'http://localhost:3005',
      credentials: true,
    })

    // Prefix global pour l'API - temporairement désactivé pour test
    // app.setGlobalPrefix('api')

    app.setGlobalPrefix('api')

    const port = 3002
    await app.listen(port, '127.0.0.1')

    logger.log(`🚀 API Test démarrée sur http://127.0.0.1:${port}`)
    logger.log(`📋 Test endpoint: http://127.0.0.1:${port}/api/admin/database/health`)
  } catch (error) {
    logger.error('❌ Erreur lors du démarrage:', error)
    process.exit(1)
  }
}

bootstrap()

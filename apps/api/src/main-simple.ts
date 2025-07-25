import { NestFactory } from '@nestjs/core'
import { Logger } from '@nestjs/common'
import { AppSimpleModule } from './app-simple.module'

async function bootstrap() {
  const logger = new Logger('SimpleBootstrap')

  try {
    const app = await NestFactory.create(AppSimpleModule, {
      logger: ['error', 'warn', 'log'],
    })

    // Configuration CORS simple
    app.enableCors({
      origin: 'http://localhost:3005',
      credentials: true,
    })

    // Prefix global pour l'API
    app.setGlobalPrefix('api/v1')

    const port = 3002
    await app.listen(port)

    logger.log(`🚀 API Simple démarrée sur http://localhost:${port}`)
    logger.log(`📋 Test endpoint: http://localhost:${port}/api/v1/admin/menu-raw/test`)
    logger.log(`🌳 Menu tree: http://localhost:${port}/api/v1/admin/menu-raw/tree`)

  } catch (error) {
    logger.error('❌ Erreur lors du démarrage:', error)
    process.exit(1)
  }
}

bootstrap()
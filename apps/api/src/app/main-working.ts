// apps/api/src/main-working.ts
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import { config } from 'dotenv'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from '../core/common/filters/http-exception.filter'
import { LoggingInterceptor } from '../core/common/interceptors/logging.interceptor'
import { TransformInterceptor } from '../core/common/interceptors/transform.interceptor'

// Chargement des variables d'environnement
config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port', 3002)
  const env = configService.get<string>('app.env', 'development')
  const corsOrigin = 'http://127.0.0.1:3005'

  // Sécurité de base
  app.use(helmet({ contentSecurityPolicy: false }))
  app.use(compression())

  // CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // Préfixe global
  app.setGlobalPrefix('api')

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  // Pipes et interceptors de base
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  )

  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalFilters(new HttpExceptionFilter())

  // Documentation Swagger simple
  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('TopSteel ERP API')
      .setDescription('API de gestion métallurgique industrielle')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build()

    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api/docs', app, document)
  }

  await app.listen(port)

  logger.log(`🚀 Serveur démarré: http://127.0.0.1:${port}`)
  logger.log(`📚 Documentation: http://127.0.0.1:${port}/api/docs`)
}

bootstrap().catch((_error) => {
  process.exit(1)
})

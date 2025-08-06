import { join } from 'node:path'
// apps/api/src/main-business-only.ts
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import { config } from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import { HttpExceptionFilter } from '../core/common/filters/http-exception.filter'
import { LoggingInterceptor } from '../core/common/interceptors/logging.interceptor'
import { TransformInterceptor } from '../core/common/interceptors/transform.interceptor'
import { AppBusinessOnlyModule } from './app-business-only.module'

// ============================================================================
// CHARGEMENT VARIABLES D'ENVIRONNEMENT MONOREPO
// ============================================================================
const isCompiled = __dirname.includes('dist')
let rootDir: string

try {
  if (isCompiled) {
    // En production: dist/app/main-business-only.js -> racine
    rootDir = join(__dirname, '../../../../../')
  } else {
    // En développement: src/app/main-business-only.ts -> racine
    rootDir = join(__dirname, '../../../../')
  }

  rootDir = rootDir.replace(/\\/g, '/')
  const envLocalPath = join(rootDir, '.env.local')

  config({ path: envLocalPath })
  config({ path: join(rootDir, '.env'), quiet: true })
} catch {
  config({ path: '.env.local', quiet: true })
  config({ path: '.env', quiet: true })
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppBusinessOnlyModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port', 3002)
  const env = configService.get<string>('app.env', 'development')
  const corsOrigin = process.env.FRONTEND_URL || 'http://127.0.0.1:3005'

  // ============================================================================
  // SÉCURITÉ ET MIDDLEWARE
  // ============================================================================

  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  )

  app.use(compression())
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Configuration CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // ============================================================================
  // CONFIGURATION GLOBALE
  // ============================================================================

  app.setGlobalPrefix('api')

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
      disableErrorMessages: false,
    })
  )

  // Interceptors globaux
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new TransformInterceptor())

  // Filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter())

  // ============================================================================
  // DOCUMENTATION SWAGGER
  // ============================================================================

  if (env !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('🏭 TopSteel ERP Business API')
      .setDescription(`
        **API métier pour l'ERP TopSteel**
        
        ✅ **Architecture Multi-Tenant DDD Fonctionnelle:**
        - Base de données AUTH, SHARED, et TENANT configurées
        - Domaines métier avec repositories complets
        - Patterns DDD implémentés
        
        🔐 **Authentification:**
        - Bearer Token JWT requis pour la plupart des endpoints
      `)
      .setVersion('1.0.0')
      .setContact('Équipe TopSteel', 'https://oweo-consulting.fr', 'support@oweo-consulting.fr')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Token JWT obtenu via /api/auth/login',
          in: 'header',
        },
        'JWT-auth'
      )
      .addTag('🤝 Partners', 'Gestion des clients et fournisseurs')
      .addTag('📦 Inventory', 'Gestion des articles et inventaire')
      .addTag('🏭 Materials', 'Catalogue des matériaux industriels')
      .addServer(
        `${process.env.API_URL || `http://127.0.0.1:${port}`}/api`,
        'API TopSteel ERP Business'
      )
      .build()

    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    })

    const swaggerOptions = {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'none',
        filter: true,
        showRequestHeaders: true,
        syntaxHighlight: {
          theme: 'tomorrow-night',
        },
        tryItOutEnabled: true,
      },
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #1976d2; }
        .swagger-ui .scheme-container { background: #f5f5f5; padding: 10px; }
      `,
      customSiteTitle: 'TopSteel ERP Business API Documentation',
    }

    SwaggerModule.setup('api/docs', app, document, swaggerOptions)

    const serverUrl = process.env.API_URL || `http://127.0.0.1:${port}`
    logger.log(`📚 Documentation Swagger: ${serverUrl}/api/docs`)
  }

  await app.listen(port)

  // ============================================================================
  // LOGS DE DÉMARRAGE INFORMATIFS
  // ============================================================================

  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('🏭     TOPSTEEL ERP BUSINESS API')
  logger.log('🏭 ===============================================')
  logger.log(`🚀 Serveur démarré: ${process.env.API_URL || `http://127.0.0.1:${port}`}`)
  logger.log(`🌟 Environnement: ${env}`)
  logger.log(`🔗 CORS Origin: ${corsOrigin}`)
  logger.log('')
  logger.log('✅ Architecture Multi-Tenant DDD Opérationnelle:')
  logger.log('   • 🏗️  3 Bases de données (auth, shared, tenant)')
  logger.log('   • 🤝 Partners: Clients/Fournisseurs')
  logger.log('   • 📦 Inventory: Articles/Stock')
  logger.log('   • 🏭 Materials: Matériaux industriels')
  logger.log('')
  logger.log('📍 URLs API disponibles:')
  logger.log('   • /api/business/partners  → Gestion clients/fournisseurs')
  logger.log('   • /api/business/inventory → Gestion articles/stock')
  logger.log('   • /api/business/materials → Gestion matériaux')
  logger.log('')
  logger.log('📚 Documentation:')
  logger.log('   • /api/docs               → Documentation Swagger')
  logger.log('')
  logger.log('📊 Health:')
  logger.log('   • /health                 → Health check')
  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('')
}

bootstrap().catch(() => {
  process.exit(1)
})

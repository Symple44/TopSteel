import { existsSync } from 'node:fs'
import { join } from 'node:path'
// apps/api/src/main.ts
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import { config } from 'dotenv'
import helmet from 'helmet'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'
import { LoggingInterceptor } from './common/interceptors/logging.interceptor'
import { TransformInterceptor } from './common/interceptors/transform.interceptor'
import { listenWithPortFallback } from './config/port-helper'

// ============================================================================
// CHARGEMENT VARIABLES D'ENVIRONNEMENT MONOREPO
// ============================================================================
console.info('🔧 __dirname:', __dirname)
const rootDir = join(__dirname, '../../../')
const envLocalPath = join(rootDir, '.env.local')
console.info('🔧 Tentative de chargement .env.local depuis:', envLocalPath)
console.info('🔧 Fichier .env.local existe?', existsSync(envLocalPath))

config({ path: envLocalPath })
config({ path: join(rootDir, '.env') })

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port', 3002)
  const env = configService.get<string>('app.env', 'development')
  const corsOrigin = configService.get<string>('app.corsOrigin', 'http://localhost:3000')

  // ============================================================================
  // SÉCURITÉ ET MIDDLEWARE
  // ============================================================================

  // Helmet pour la sécurité
  app.use(
    helmet({
      contentSecurityPolicy:
        env === 'production'
          ? {
              directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'blob:'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'"],
                objectSrc: ["'none'"],
                mediaSrc: ["'self'"],
                frameSrc: ["'none'"],
              },
            }
          : false,
      crossOriginEmbedderPolicy: env === 'production',
      crossOriginOpenerPolicy: { policy: 'same-origin' },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: 'deny' },
      hidePoweredBy: true,
      hsts: env === 'production',
    })
  )

  // Compression pour les performances
  app.use(compression())

  // Configuration CORS
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // ============================================================================
  // CONFIGURATION VERSIONING
  // ============================================================================

  app.use((req: any, res: any, next: any) => {
    if (req.originalUrl.startsWith('/api/') && !req.originalUrl.includes('/v1/')) {
      const newUrl = req.originalUrl.replace('/api/', '/api/v1/')
      return res.redirect(308, newUrl)
    }
    next()
  })

  // Prefix global pour l'API
  app.setGlobalPrefix('api')

  // Configuration versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  })

  // ============================================================================
  // VALIDATION ET INTERCEPTORS GLOBAUX
  // ============================================================================

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
    })
  )

  // Interceptors globaux
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new TransformInterceptor())

  // Filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter())

  // ============================================================================
  // DOCUMENTATION SWAGGER COMPLÈTE V1/V2
  // ============================================================================

  if (env !== 'production') {
    // Documentation API V1 (Version par défaut actuelle)
    const configV1 = new DocumentBuilder()
      .setTitle('🏭 TopSteel ERP API v1')
      .setDescription(
        `
        **API de gestion métallurgique industrielle - Version 1**
        
        📍 **URLs disponibles:**
        - \`/api/users\` → Version 1 (défaut actuel)
        - \`/api/v1/users\` → Version 1 explicite
        - \`/api/v2/users\` → Version 2 (future)
        
        🔐 **Authentification:**
        - Bearer Token JWT requis pour la plupart des endpoints
        - Utilisez \`/api/auth/login\` pour obtenir un token
      `
      )
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
      .addTag('🔐 Auth', 'Authentification et autorisation')
      .addTag('👤 Users', 'Gestion des utilisateurs et rôles')
      .addTag('🏢 Clients', 'Gestion de la clientèle et CRM')
      .addTag('🚚 Fournisseurs', 'Gestion des fournisseurs')
      .addTag('📁 Projets', 'Gestion des projets métallurgiques')
      .addTag('🛒 Commandes', 'Gestion des commandes fournisseurs')
      .addTag('🏭 Production', 'Gestion de la production et fabrication')
      .addTag('🏭 Ordre de fabrication', 'Gestion des ordres de fabrication')
      .addTag('📦 Stocks', 'Gestion des stocks et inventaire')
      .addTag('📦 Produits', 'Gestion des produits')
      .addTag('🔧 Machines', 'Gestion du parc machines')
      .addTag('⚙️ Maintenance', 'Planification et suivi maintenance')
      .addTag('🧱 Matériaux', 'Catalogue des matériaux')
      .addTag('📅 Planning', 'Planification et calendrier')
      .addTag('✅ Qualité', 'Contrôle qualité et conformité')
      .addTag('📋 Traçabilité', 'Traçabilité des produits')
      .addTag('💰 Devis', 'Création et gestion des devis')
      .addTag('🧾 Facturation', 'Facturation et comptabilité')
      .addTag('📄 Documents', 'Gestion électronique de documents')
      .addTag('🔔 Notifications', 'Système de notifications')
      .addServer(`http://localhost:${port}/`, 'Serveur de développement')
      .addServer(`http://localhost:${port}/v1`, 'API V1 explicite')
      .build()

    // Documentation API V2 (Future - préparation)
    const configV2 = new DocumentBuilder()
      .setTitle('🏭 TopSteel ERP API v2')
      .setDescription(
        `
        **API de gestion métallurgique industrielle - Version 2 (Préparation)**
        
        🚀 **Nouvelles fonctionnalités V2:**
        - Pagination avancée avec curseurs
        - Filtres et tri enrichis
        - Réponses avec métadonnées complètes
        - Nouveaux endpoints d'analytics
        
        ✨ **Améliorations:** Performances, sécurité et nouvelles fonctionnalités
      `
      )
      .setVersion('2.0.0-beta')
      .setContact('Équipe TopSteel', 'https://topsteel.com', 'support@topsteel.com')
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
      .addTag('🔐 Auth V2', 'Authentification améliorée')
      .addTag('👤 Users V2', 'Gestion utilisateurs avec analytics')
      .addTag('📊 Analytics', 'Tableaux de bord et métriques (Nouveau)')
      .addServer(`http://localhost:${port}/v2`, 'API V2 (Bêta)')
      .build()

    // Génération des documents Swagger
    const documentV1 = SwaggerModule.createDocument(app, configV1, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    })

    const documentV2 = SwaggerModule.createDocument(app, configV2, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    })

    // Configuration des endpoints de documentation
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
      customSiteTitle: 'TopSteel ERP API Documentation',
    }

    // Setup documentation V1 (défaut)
    SwaggerModule.setup('api/docs', app, documentV1, swaggerOptions)

    // Setup documentation V1 explicite
    SwaggerModule.setup('api/v1/docs', app, documentV1, {
      ...swaggerOptions,
      customSiteTitle: 'TopSteel ERP API v1 Documentation',
    })

    // Setup documentation V2 (future)
    SwaggerModule.setup('api/v2/docs', app, documentV2, {
      ...swaggerOptions,
      customSiteTitle: 'TopSteel ERP API v2 Documentation (Beta)',
    })

    logger.log(`📚 Documentation Swagger V1 (défaut): http://localhost:${port}/api/docs`)
    logger.log(`📚 Documentation Swagger V1 explicite: http://localhost:${port}/api/v1/docs`)
    logger.log(`📚 Documentation Swagger V2 (beta): http://localhost:${port}/api/v2/docs`)
  }

  // Graceful shutdown
  const gracefulShutdown = () => {
    logger.log('🔄 Arrêt gracieux du serveur...')
    app.close().then(() => {
      logger.log('✅ Serveur arrêté avec succès')
      process.exit(0)
    })
  }

  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)

  // Gestion intelligente des ports avec fallback
  const actualPort = await listenWithPortFallback(app, configService, logger)

  // Mise à jour des logs avec le port réel
  const portForLogs = actualPort

  // ============================================================================
  // LOGS DE DÉMARRAGE INFORMATIFS
  // ============================================================================

  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('🏭           TOPSTEEL ERP API')
  logger.log('🏭 ===============================================')
  logger.log(`🚀 Serveur démarré: http://localhost:${portForLogs}`)
  logger.log(`🌟 Environnement: ${env}`)
  logger.log(`🔗 CORS Origin: ${corsOrigin}`)
  logger.log('')
  logger.log('📍 URLs API disponibles:')
  logger.log('   • /api/users           → V1 (défaut actuel)')
  logger.log('   • /api/v1/users        → V1 explicite')
  logger.log('   • /api/v2/users        → V2 (future)')
  logger.log('')
  logger.log('📚 Documentation Swagger:')
  logger.log('   • /api/docs           → V1 (défaut)')
  logger.log('   • /api/v1/docs        → V1 explicite')
  logger.log('   • /api/v2/docs        → V2 (beta)')
  logger.log('')
  logger.log('📊 Monitoring:')
  logger.log('   • /health             → Health check')
  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('')
}

bootstrap().catch((error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error)
  process.exit(1)
})

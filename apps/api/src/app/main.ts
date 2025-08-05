import { join } from 'node:path'
// apps/api/src/main.ts
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
import { EnhancedServerManager } from '../core/config/enhanced-server-manager'
import { GracefulShutdownService } from '../core/config/graceful-shutdown.service'
import { listenWithPortFallback } from '../core/config/port-helper'
import { MetricsSafeInterceptor } from '../infrastructure/monitoring/metrics-safe.interceptor'
import { EnhancedThrottlerGuard } from '../infrastructure/security/guards/enhanced-throttler.guard'
import { AppModule } from './app.module'

// ============================================================================
// CHARGEMENT VARIABLES D'ENVIRONNEMENT MONOREPO
// ============================================================================
// Ajustement du chemin selon l'environnement avec path.resolve pour Windows
const isCompiled = __dirname.includes('dist')
let rootDir: string

try {
  if (isCompiled) {
    // En production: dist/main.js -> ../../../../
    rootDir = join(__dirname, '../../../../')
  } else {
    // En développement: src/main.ts -> ../../../
    rootDir = join(__dirname, '../../../')
  }

  // Normaliser le chemin pour Windows
  rootDir = rootDir.replace(/\\/g, '/')

  const envLocalPath = join(rootDir, '.env.local')

  // Chargement silencieux des variables d'environnement
  config({ path: envLocalPath, quiet: true })
  config({ path: join(rootDir, '.env'), quiet: true })
} catch (_error) {
  // Fallback: essayer de charger depuis le répertoire courant
  config({ path: '.env.local', quiet: true })
  config({ path: '.env', quiet: true })
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  try {
    // Nettoyage silencieux sauf si problème détecté
    const targetPort = parseInt(process.env.PORT || process.env.API_PORT || '3002')

    // Vérifier d'abord la disponibilité du port
    const isPortFree = await EnhancedServerManager.isPortAvailable(targetPort)

    if (!isPortFree) {
      logger.log(`🔍 Port ${targetPort} occupé, nettoyage...`)

      // Nettoyer les processus orphelins d'abord
      await EnhancedServerManager.cleanupOrphanedProcesses()

      // Nettoyage complet du port avec retry
      const success = await EnhancedServerManager.cleanupPort(targetPort, 2)
      if (!success) {
        logger.warn(`⚠️  Port ${targetPort} occupé, utilisation du fallback automatique`)
      }
    }
  } catch (error) {
    logger.warn(`⚠️  Erreur lors du nettoyage initial: ${error}`)
  }

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  })

  const configService = app.get(ConfigService)
  const port = configService.get<number>('app.port', 3002)
  const env = configService.get<string>('app.env', 'development')
  const corsOrigin =
    configService.get<string>('app.cors.origin') ||
    process.env.FRONTEND_URL ||
    process.env.API_CORS_ORIGIN ||
    'http://127.0.0.1:3005'

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

  // S'assurer que le parsing JSON est activé avec une limite raisonnable
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))

  // Configuration CORS
  app.enableCors({
    origin: env === 'development' ? [corsOrigin, 'null'] : corsOrigin, // Permettre 'null' en développement pour les fichiers locaux
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // ============================================================================
  // CONFIGURATION GLOBALE
  // ============================================================================

  // Configuration du préfixe global
  app.setGlobalPrefix('api')

  // ============================================================================
  // VALIDATION ET INTERCEPTORS GLOBAUX
  // ============================================================================

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false, // Temporairement désactivé pour debug
      transformOptions: {
        enableImplicitConversion: true,
      },
      validationError: {
        target: false,
        value: false,
      },
      disableErrorMessages: false, // S'assurer que les messages d'erreur sont visibles
    })
  )

  // Interceptors globaux
  app.useGlobalInterceptors(new LoggingInterceptor())
  app.useGlobalInterceptors(new TransformInterceptor())
  app.useGlobalInterceptors(app.get(MetricsSafeInterceptor))

  // Filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter())

  // Guards globaux - Utiliser le guard standard pour éviter les complications
  app.useGlobalGuards(app.get(EnhancedThrottlerGuard))

  // ============================================================================
  // DOCUMENTATION SWAGGER
  // ============================================================================

  if (env !== 'production') {
    // Configuration API unique
    const config = new DocumentBuilder()
      .setTitle('🏭 TopSteel ERP API')
      .setDescription(
        `
        **API de gestion métallurgique industrielle**
        
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
      .addTag('🤝 Partenaires', 'Gestion des clients et fournisseurs')
      .addTag('📦 Articles', 'Gestion des articles et inventaire')
      .addTag('🏭 Matériaux', 'Catalogue des matériaux industriels')
      .addTag('📁 Projets', 'Gestion des projets métallurgiques')
      .addTag('🛒 Commandes', 'Gestion des commandes fournisseurs')
      .addTag('🏭 Production', 'Gestion de la production et fabrication')
      .addTag('🏭 Ordre de fabrication', 'Gestion des ordres de fabrication')
      .addTag('📦 Stocks', 'Gestion des stocks et inventaire')
      .addTag('📦 Produits', 'Gestion des produits')
      .addTag('🔧 Machines', 'Gestion du parc machines')
      .addTag('⚙️ Maintenance', 'Planification et suivi maintenance')
      .addTag('📅 Planning', 'Planification et calendrier')
      .addTag('✅ Qualité', 'Contrôle qualité et conformité')
      .addTag('📋 Traçabilité', 'Traçabilité des produits')
      .addTag('💰 Devis', 'Création et gestion des devis')
      .addTag('🧾 Facturation', 'Facturation et comptabilité')
      .addTag('📄 Documents', 'Gestion électronique de documents')
      .addTag('🔔 Notifications', 'Système de notifications')
      .addServer(`${process.env.API_URL || `http://127.0.0.1:${port}`}/api`, 'API TopSteel ERP')
      .build()

    // Génération du document Swagger
    const document = SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey: string, methodKey: string) => methodKey,
    })

    // Configuration de l'interface Swagger
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

    // Setup documentation unique
    SwaggerModule.setup('api/docs', app, document, swaggerOptions)

    const serverUrl = process.env.API_URL || `http://127.0.0.1:${port}`
    logger.log(`📚 Documentation Swagger: ${serverUrl}/api/docs`)
  }

  // Système de graceful shutdown amélioré
  const gracefulShutdownService = new GracefulShutdownService()

  // Gestion intelligente des ports avec fallback
  const actualPort = await listenWithPortFallback(app, configService, logger)

  // Configurer le service de shutdown avec les infos de l'app
  gracefulShutdownService.setApp(app, actualPort)
  gracefulShutdownService.setupSignalHandlers()

  // Mise à jour des logs avec le port réel
  const portForLogs = actualPort

  // ============================================================================
  // LOGS DE DÉMARRAGE INFORMATIFS
  // ============================================================================

  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('🏭           TOPSTEEL ERP API')
  logger.log('🏭 ===============================================')
  logger.log(`🚀 Serveur démarré: ${process.env.API_URL || `http://127.0.0.1:${portForLogs}`}`)
  logger.log(`🌟 Environnement: ${env}`)
  logger.log(`🔗 CORS Origin: ${corsOrigin}`)
  logger.log('')
  logger.log('📍 URLs API disponibles:')
  logger.log('   • /api/auth            → Authentification')
  logger.log('   • /api/users           → Gestion utilisateurs')
  logger.log('   • /api/business/*      → Modules métier')
  logger.log('   • /api/admin/*         → Administration')
  logger.log('')
  logger.log('📚 Documentation:')
  logger.log('   • /api/docs            → Documentation Swagger')
  logger.log('')
  logger.log('📊 Monitoring:')
  logger.log('   • /health              → Health check')
  logger.log('')
  logger.log('🏭 ===============================================')
  logger.log('')
}

bootstrap().catch((_error) => {
  process.exit(1)
})

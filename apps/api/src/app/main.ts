import { join } from 'node:path'
// apps/api/src/main.ts
import { Logger, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { HttpExceptionFilter } from '../core/common/filters/http-exception.filter'
import { LoggingInterceptor } from '../core/common/interceptors/logging.interceptor'
import { TransformInterceptor } from '../core/common/interceptors/transform.interceptor'
import { cleanupPort, isPortAvailable } from '../core/config/enhanced-server-manager'
import { envValidator } from '../core/config/env-validator'
import { GracefulShutdownService } from '../core/config/graceful-shutdown.service'
import { listenWithPortFallback } from '../core/config/port-helper'
import { MetricsSafeInterceptor } from '../infrastructure/monitoring/metrics-safe.interceptor'
import { EnhancedThrottlerGuard } from '../infrastructure/security/guards/enhanced-throttler.guard'
import { SanitizedLoggingInterceptor } from '../infrastructure/security/log-sanitization/sanitized-logging.interceptor'
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
} catch {
  // Fallback: essayer de charger depuis le répertoire courant
  config({ path: '.env.local', quiet: true })
  config({ path: '.env', quiet: true })
}

async function bootstrap() {
  const logger = new Logger('Bootstrap')

  // ============================================================================
  // VALIDATION SÉCURISÉE DES VARIABLES D'ENVIRONNEMENT
  // ============================================================================

  try {
    logger.log("🔍 Validation des variables d'environnement...")

    // Valider les variables d'environnement avec rapport de sécurité
    const validationResult = await envValidator.validate({
      throwOnError: false,
      logValidation: false,
      validateSecrets: true,
    })

    if (validationResult.success) {
      logger.log("✅ Variables d'environnement validées avec succès")

      // Afficher les avertissements de sécurité s'il y en a
      if (validationResult.warnings && validationResult.warnings.length > 0) {
        logger.warn('⚠️  Avertissements de sécurité détectés:')
        for (const warning of validationResult.warnings) {
          logger.warn(`  • ${warning}`)
        }

        if (process.env.NODE_ENV === 'production') {
          logger.warn(
            '🔐 IMPORTANT: Corrigez ces problèmes de sécurité avant le déploiement en production!'
          )
        }
      }
    } else {
      logger.error("❌ Échec de la validation des variables d'environnement:")
      if (validationResult.errors) {
        for (const error of validationResult.errors) {
          logger.error(`  • ${error}`)
        }
      }

      if (process.env.NODE_ENV === 'production') {
        logger.error("🚨 ARRÊT: Variables d'environnement invalides en production")
        process.exit(1)
      } else {
        logger.warn('⚠️  Continuation en développement avec des variables invalides')
      }
    }
  } catch (error) {
    logger.error("❌ Erreur lors de la validation des variables d'environnement:", error)
    if (process.env.NODE_ENV === 'production') {
      process.exit(1)
    }
  }

  try {
    // Nettoyage silencieux sauf si problème détecté
    const targetPort = parseInt(process.env.PORT || process.env.API_PORT || '3002', 10)

    // Vérifier d'abord la disponibilité du port
    const isPortFree = await isPortAvailable(targetPort)

    if (!isPortFree) {
      logger.log(`🔍 Port ${targetPort} occupé, nettoyage...`)

      // Nettoyage complet du port avec retry
      const success = await cleanupPort(targetPort, 2)
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

  // Désactiver complètement les redirections automatiques d'Express
  const expressApp = app.getHttpAdapter().getInstance()
  expressApp.set('strict routing', false)
  expressApp.set('x-powered-by', false)

  // Middleware pour gérer les trailing slashes sans redirection
  expressApp.use((req: Request, _res: Response, next: NextFunction) => {
    // Supprimer le trailing slash si présent (sauf pour la racine)
    if (req.path !== '/' && req.path.endsWith('/')) {
      req.url = req.url.slice(0, -1)
      // Note: req.path est en lecture seule, on modifie seulement req.url
    }
    next()
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

  // Helmet pour la sécurité de base (CSP géré par notre middleware personnalisé)
  app.use(
    helmet({
      contentSecurityPolicy: false, // Désactivé - géré par notre middleware CSP personnalisé
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

  // Cookie parser pour CSRF
  app.use(cookieParser())

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
  // Utiliser l'intercepteur sanitisé en production, le standard en développement
  if (process.env.NODE_ENV === 'production') {
    app.useGlobalInterceptors(app.get(SanitizedLoggingInterceptor))
  } else {
    app.useGlobalInterceptors(new LoggingInterceptor())
  }
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

bootstrap().catch(() => {
  process.exit(1)
})

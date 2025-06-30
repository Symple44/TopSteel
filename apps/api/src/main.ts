// apps/api/src/main.ts
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import compression from "compression";
import { config } from 'dotenv';
import { existsSync } from 'fs';
import helmet from 'helmet';
import { WinstonModule } from "nest-winston";
import { join } from 'path';
import * as winston from "winston";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

// ============================================================================
// CHARGEMENT VARIABLES D'ENVIRONNEMENT MONOREPO
// ============================================================================
// Debug du chemin d'exécution
console.log('🔧 __dirname:', __dirname);
const rootDir = join(__dirname, '../../../'); // ← Corrigé: remonter 3 niveaux
const envLocalPath = join(rootDir, '.env.local');
console.log('🔧 Tentative de chargement .env.local depuis:', envLocalPath);
console.log('🔧 Fichier .env.local existe?', existsSync(envLocalPath));

config({ path: envLocalPath });
config({ path: join(rootDir, '.env') });

async function bootstrap() {
  // Configuration du logger
  const logger = WinstonModule.createLogger({
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context }) => {
            return `${timestamp} [${context}] ${level}: ${message}`;
          })
        ),
      }),
      new winston.transports.File({
        filename: "logs/error.log",
        level: "error",
      }),
      new winston.transports.File({
        filename: "logs/combined.log",
      }),
    ],
  });

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>("app.port", 3001);
  const env = configService.get<string>("app.env", "development");

  // Sécurité renforcée avec Helmet
  app.use(
    helmet({
      contentSecurityPolicy: env === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
      crossOriginEmbedderPolicy: env === "production",
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: env === "production",
    })
  );

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get("app.corsOrigin", "http://localhost:3000"),
    credentials: true,
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  );

  // Interceptors globaux
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalInterceptors(new TransformInterceptor());

  // Filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter());

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Documentation Swagger
  if (env !== "production") {
    const config = new DocumentBuilder()
      .setTitle("TopSteel ERP API")
      .setDescription("API complète pour la gestion ERP métallurgique")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("Auth", "Authentification et autorisation")
      .addTag("Users", "Gestion des utilisateurs")
      .addTag("Clients", "Gestion des clients")
      .addTag("Projets", "Gestion des projets")
      .addTag("Stocks", "Gestion des stocks")
      .addTag("Production", "Gestion de la production")
      .addTag("Documents", "Gestion des documents")
      .addTag("Notifications", "Système de notifications")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    logger.log(`📚 Documentation Swagger disponible sur: http://localhost:${port}/api/docs`);
  }

  // Graceful shutdown
  const gracefulShutdown = () => {
    logger.log("🔄 Arrêt gracieux du serveur...");
    app.close().then(() => {
      logger.log("✅ Serveur arrêté avec succès");
      process.exit(0);
    });
  };

  process.on("SIGTERM", gracefulShutdown);
  process.on("SIGINT", gracefulShutdown);

  await app.listen(port);

  logger.log(`🚀 Serveur NestJS démarré sur: http://localhost:${port}`);
  logger.log(`🌟 Environnement: ${env}`);
  logger.log(`📊 Health check: http://localhost:${port}/health`);
  
  // Log des variables d'environnement importantes (debugging)
  if (env === 'development') {
    logger.log(`🔧 DB_HOST: ${process.env.DB_HOST}`);
    logger.log(`🔧 DB_NAME: ${process.env.DB_NAME}`);
    logger.log(`🔧 NODE_ENV: ${process.env.NODE_ENV}`);
  }
}

bootstrap().catch((error) => {
  console.error("❌ Erreur lors du démarrage du serveur:", error);
  process.exit(1);
});
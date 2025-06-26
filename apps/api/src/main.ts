// apps/api/src/main.ts
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import helmet from 'helmet';
import { WinstonModule } from "nest-winston";
import * as winston from "winston";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

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

  // Sécurité
  // Sécurité renforcée avec Helmet 8+
  app.use(
    helmet({
      // Content Security Policy adapté pour un ERP
      contentSecurityPolicy: env === "production" ? {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Pour les styles inline nécessaires
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "blob:"], // Pour les uploads d'images
          connectSrc: ["'self'"], // Pour les WebSockets et API calls
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      } : false,
      
      // Protection Cross-Origin pour les APIs
      crossOriginEmbedderPolicy: env === "production",
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      
      // Headers de sécurité renforcés
      dnsPrefetchControl: { allow: false },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: env === "production" ? {
        maxAge: 31536000, // 1 an
        includeSubDomains: true,
        preload: true
      } : false,
      
      // Protection contre les attaques
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: { policy: "no-referrer" },
      xssFilter: true,
    })
  );

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get("app.cors.origin", ["http://localhost:3000"]),
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  });

  // Prefix global pour l'API
  app.setGlobalPrefix("api", {
    exclude: ["/", "/health"],
  });

  // Versioning de l'API
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Validation globale
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Filtres et intercepteurs globaux
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor()
  );

  // Documentation Swagger
  if (env !== "production") {
    const config = new DocumentBuilder()
      .setTitle("ERP TOPSTEEL API")
      .setDescription("API pour l'ERP de gestion métallurgique TOPSTEEL")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth"
      )
      .addTag("Auth", "Authentification et autorisation")
      .addTag("Users", "Gestion des utilisateurs")
      .addTag("Clients", "Gestion des clients")
      .addTag("Fournisseurs", "Gestion des fournisseurs")
      .addTag("Projets", "Gestion des projets")
      .addTag("Devis", "Gestion des devis")
      .addTag("Facturation", "Gestion de la facturation")
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
}

bootstrap().catch((error) => {
  console.error("❌ Erreur lors du démarrage du serveur:", error);
  process.exit(1);
});




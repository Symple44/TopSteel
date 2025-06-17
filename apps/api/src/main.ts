// apps/api/src/main.ts
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as compression from "compression";
import * as helmet from "helmet";
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
  app.use(
    helmet({
      contentSecurityPolicy: env === "production" ? undefined : false,
    })
  );

  // Compression
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get<string[]>("app.corsOrigins", [
      "http://localhost:3000",
    ]),
    credentials: true,
  });

  // Préfixe global
  app.setGlobalPrefix("api");

  // Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: "1",
  });

  // Pipes globaux
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    })
  );

  // Filtres globaux
  app.useGlobalFilters(new HttpExceptionFilter());

  // Intercepteurs globaux
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor()
  );

  // Configuration Swagger
  if (env !== "production") {
    const config = new DocumentBuilder()
      .setTitle("ERP TOPSTEEL API")
      .setDescription("API pour la gestion ERP de métallerie")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("auth", "Authentification")
      .addTag("users", "Gestion des utilisateurs")
      .addTag("projets", "Gestion des projets")
      .addTag("clients", "Gestion des clients")
      .addTag("production", "Gestion de la production")
      .addTag("stocks", "Gestion des stocks")
      .addTag("devis", "Gestion des devis")
      .addTag("documents", "Gestion des documents")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Démarrage du serveur
  await app.listen(port);
  logger.log(
    `🚀 Application running on: http://localhost:${port}/api`,
    "Bootstrap"
  );
  logger.log(
    `📚 Documentation available at: http://localhost:${port}/api/docs`,
    "Bootstrap"
  );
  logger.log(`🌍 Environment: ${env}`, "Bootstrap");
}

bootstrap();

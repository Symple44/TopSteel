// apps/api/src/app.module.ts
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import * as redisStore from "cache-manager-redis-store";

// Configuration
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import redisConfig from "./config/redis.config";

// Modules métier
import { AuthModule } from "./modules/auth/auth.module";
import { ClientsModule } from "./modules/clients/clients.module";
import { DevisModule } from "./modules/devis/devis.module";
import { DocumentsModule } from "./modules/documents/documents.module";
import { FacturationModule } from "./modules/facturation/facturation.module";
import { FournisseursModule } from "./modules/fournisseurs/fournisseurs.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { ProductionModule } from "./modules/production/production.module";
import { ProjetsModule } from "./modules/projets/projets.module";
import { StocksModule } from "./modules/stocks/stocks.module";
import { UsersModule } from "./modules/users/users.module";

// Common modules
import { DatabaseModule } from "./database/database.module";

// Middleware
import { LoggerMiddleware } from "./common/middleware/logger.middleware";

// Controllers
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // Configuration globale
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      envFilePath: [".env.local", ".env"],
      expandVariables: true,
    }),

    // Base de données
    DatabaseModule,

    // Cache Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore as any,
        host: configService.get("redis.host"),
        port: configService.get("redis.port"),
        password: configService.get("redis.password"),
        db: configService.get("redis.db"),
        ttl: configService.get("redis.ttl"),
        max: configService.get("redis.max"),
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Bull Queue (Redis)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get("redis.host"),
          port: configService.get("redis.port"),
          password: configService.get("redis.password"),
        },
      }),
      inject: [ConfigService],
    }),

    // Scheduler pour les tâches cron
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get("app.throttle.ttl", 60000),
          limit: configService.get("app.throttle.limit", 10),
        },
      ],
      inject: [ConfigService],
    }),

    // Modules métier
    AuthModule,
    UsersModule,
    ClientsModule,
    FournisseursModule,
    ProjetsModule,
    DevisModule,
    FacturationModule,
    StocksModule,
    ProductionModule,
    DocumentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
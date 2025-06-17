// apps/api/src/app.module.ts
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { TypeOrmModule } from "@nestjs/typeorm";
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

// Middleware
import { LoggerMiddleware } from "./common/middleware/logger.middleware";

// Controllers
import { AppController } from "./app.controller";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, redisConfig],
      envFilePath: [".env.local", ".env"],
    }),

    // Base de données
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("database.host"),
        port: configService.get("database.port"),
        username: configService.get("database.username"),
        password: configService.get("database.password"),
        database: configService.get("database.name"),
        entities: [__dirname + "/**/*.entity{.ts,.js}"],
        synchronize: configService.get("app.env") === "development",
        logging: configService.get("app.env") === "development",
        ssl: configService.get("database.ssl"),
        extra: {
          max: configService.get("database.maxConnections", 100),
        },
      }),
      inject: [ConfigService],
    }),

    // Cache Redis
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get("redis.host"),
        port: configService.get("redis.port"),
        password: configService.get("redis.password"),
        ttl: 60 * 60, // 1 heure par défaut
      }),
      inject: [ConfigService],
      isGlobal: true,
    }),

    // Queue Redis (Bull)
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

    // Planification des tâches
    ScheduleModule.forRoot(),

    // Rate limiting
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),

    // Modules métier
    AuthModule,
    UsersModule,
    ProjetsModule,
    ClientsModule,
    ProductionModule,
    StocksModule,
    DevisModule,
    DocumentsModule,
    FournisseursModule,
    FacturationModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}

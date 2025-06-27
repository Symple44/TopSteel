// apps/api/src/app.module.ts
import { BullModule } from "@nestjs/bull";
import { CacheModule } from "@nestjs/cache-manager";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule } from "@nestjs/throttler";
import { TerminusModule } from "@nestjs/terminus";
import * as redisStore from "cache-manager-redis-store";

// Configuration
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import redisConfig from "./config/redis.config";

// Modules métier existants
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

// Nouveaux modules métallurgie
import { MateriauxModule } from "./modules/materiaux/materiaux.module";
import { MachinesModule } from "./modules/machines/machines.module";
import { PlanningModule } from "./modules/planning/planning.module";
import { QualiteModule } from "./modules/qualite/qualite.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { TracabiliteModule } from "./modules/tracabilite/tracabilite.module";

// Modules système
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { IntegrityService } from "./health/integrity.service";

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

    // Health checks
    TerminusModule,

    // Scheduler pour les tâches cron
    ScheduleModule.forRoot(),

    // Modules métier existants
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

    // Nouveaux modules métallurgie
    MateriauxModule,
    MachinesModule,
    PlanningModule,
    QualiteModule,
    MaintenanceModule,
    TracabiliteModule,
  ],
  controllers: [AppController, HealthController],
  providers: [AppService, IntegrityService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes("*");
  }
}
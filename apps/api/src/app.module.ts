// apps/api/src/app.module.ts
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { TerminusModule } from "@nestjs/terminus";

// Configuration
import appConfig from "./config/app.config";
import databaseConfig from "./config/database.config";
import jwtConfig from "./config/jwt.config";
import redisConfig from './config/redis.config';
import { RedisModule } from './redis/redis.module';

// Modules système
import { DatabaseModule } from "./database/database.module";
import { HealthController } from "./health/health.controller";
import { IntegrityService } from "./health/integrity.service";

// Module d'authentification
import { AuthModule } from "./modules/auth/auth.module";

// Modules métier harmonisés
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
import { MachinesModule } from "./modules/machines/machines.module";
import { MaintenanceModule } from "./modules/maintenance/maintenance.module";
import { MateriauxModule } from "./modules/materiaux/materiaux.module";
import { PlanningModule } from "./modules/planning/planning.module";
import { QualiteModule } from "./modules/qualite/qualite.module";
import { TracabiliteModule } from "./modules/tracabilite/tracabilite.module";


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
      expandVariables: true,
    }),
    
    // Modules système
    DatabaseModule,
    ScheduleModule.forRoot(),
    TerminusModule,
    RedisModule,
    
    // Authentification
    AuthModule,
    
    // Modules métier
    ClientsModule,
    DevisModule,
    DocumentsModule,
    FacturationModule,
    FournisseursModule,
    NotificationsModule,
    ProductionModule,
    ProjetsModule,
    StocksModule,
    UsersModule,
    MachinesModule,
    MaintenanceModule,
    MateriauxModule,
    PlanningModule,
    QualiteModule,
    TracabiliteModule,

  ],
  controllers: [AppController, HealthController],
  providers: [AppService, IntegrityService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}

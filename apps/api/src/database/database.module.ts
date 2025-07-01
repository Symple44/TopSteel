// apps/api/src/database/database.module.ts
import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

// Import explicite de TOUTES les entités pour debugging
import { Clients } from "../modules/clients/entities/clients.entity";
import { Commande } from "../modules/commandes/entities/commande.entity";
import { Devis } from "../modules/devis/entities/devis.entity";
import { Document } from "../modules/documents/entities/document.entity";
import { Facturation } from "../modules/facturation/entities/facturation.entity";
import { Fournisseur } from "../modules/fournisseurs/entities/fournisseur.entity";
import { Machine } from "../modules/machines/entities/machine.entity";
import { Maintenance } from "../modules/maintenance/entities/maintenance.entity";
import { Materiaux } from "../modules/materiaux/entities/materiaux.entity";
import { Notifications } from "../modules/notifications/entities/notifications.entity";
import { Planning } from "../modules/planning/entities/planning.entity";
import { OrdreFabrication } from "../modules/production/entities/ordre-fabrication.entity";
import { Production } from "../modules/production/entities/production.entity";
import { Projet } from "../modules/projets/entities/projet.entity";
import { Qualite } from "../modules/qualite/entities/qualite.entity";
import { Produit } from "../modules/stocks/entities/produit.entity";
import { Stocks } from "../modules/stocks/entities/stocks.entity";
import { Tracabilite } from "../modules/tracabilite/entities/tracabilite.entity";
import { User } from "../modules/users/entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>("DB_HOST") || "localhost";
        const port = configService.get<number>("DB_PORT") || 5432;
        const username = configService.get<string>("DB_USERNAME") || "postgres";
        const password = configService.get<string>("DB_PASSWORD") || "postgres";
        const database = configService.get<string>("DB_NAME") || "erp_topsteel";
        const synchronize =
          configService.get<boolean>("DB_SYNCHRONIZE") || false;
        const logging = configService.get<boolean>("DB_LOGGING") || false;
        const ssl = configService.get<boolean>("DB_SSL");

        console.info(
          "🔧 DatabaseModule - Configuration reçue du ConfigService:",
        );
        console.info(`  host: ${host}`);
        console.info(`  port: ${port}`);
        console.info(`  username: ${username}`);
        console.info(`  password: ${"*".repeat(password?.length || 0)}`);
        console.info(`  database: ${database}`);
        console.info(`  synchronize: ${synchronize}`);
        console.info(`  ssl: ${ssl}`);

        // TOUTES les entités du système
        const entities = [
          // Entités principales avec UUID (BaseAuditEntity)
          User,
          Clients,
          Fournisseur,
          Machine,
          Notifications,
          Production,
          Stocks,
          Maintenance,
          Materiaux,
          Planning,
          Qualite,
          Tracabilite,
          Devis,
          Facturation,

          // Entités avec ID number (PrimaryGeneratedColumn)
          Produit,
          Commande,
          OrdreFabrication,
          Projet,
          Document,
        ];

        console.info(
          "🔧 Entités chargées:",
          entities.map((e) => e.name),
        );
        console.info(`🔧 Nombre total d'entités: ${entities.length}`);

        return {
          type: "postgres",
          host,
          port,
          username,
          password,
          database,
          entities,
          synchronize,
          logging,
          ssl: false, // Désactivé pour le développement local
          extra: {
            // Options supplémentaires pour PostgreSQL local
            sslmode: "disable",
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

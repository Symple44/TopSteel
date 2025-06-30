// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Import explicite des entités pour debugging
import { Client } from '../modules/clients/entities/clients.entity';
import { Commande } from '../modules/commandes/entities/commande.entity';
import { Machine } from '../modules/machines/entities/machine.entity';
import { Notification } from '../modules/notifications/entities/notifications.entity'; // ← Après correction
import { OrdreFabrication } from '../modules/production/entities/ordre-fabrication.entity';
import { Projet } from '../modules/projets/entities/projet.entity';
import { Produit } from '../modules/stocks/entities/produit.entity';
import { User } from '../modules/users/entities/user.entity';
// import { Facturation } from '../modules/facturation/entities/facturation.entity'; // ← À créer si nécessaire

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        
        console.log('🔧 DatabaseModule - Configuration reçue du ConfigService:');
        console.log('  host:', dbConfig?.host);
        console.log('  port:', dbConfig?.port);
        console.log('  username:', dbConfig?.username);
        console.log('  password:', dbConfig?.password ? '***' : '(vide)');
        console.log('  database:', dbConfig?.database);
        console.log('  synchronize:', dbConfig?.synchronize);

        // Test : charger toutes les entités disponibles
        const entities = [
          User, 
          Client, 
          Projet, 
          OrdreFabrication, 
          Commande, 
          Produit, 
          Machine,
          Notification // ← Après correction du nom
          // Facturation // ← À ajouter si l'entité existe
        ];
        console.log('🔧 Entités chargées:', entities.map(e => e.name));

        return {
          type: 'postgres',
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          entities: entities, // ← Entities explicites plutôt que pattern globbing
          synchronize: dbConfig.synchronize,
          logging: false,
          ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
          autoLoadEntities: false, // ← Désactivé car on charge manuellement
          retryAttempts: 3,
          retryDelay: 3000,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
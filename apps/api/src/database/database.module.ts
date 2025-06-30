// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Import explicite des entités pour debugging
import { Clients } from '../modules/clients/entities/clients.entity';
import { Commande } from '../modules/commandes/entities/commande.entity';
import { Machine } from '../modules/machines/entities/machine.entity';
import { Notifications } from '../modules/notifications/entities/notifications.entity';
import { OrdreFabrication } from '../modules/production/entities/ordre-fabrication.entity';
import { Projet } from '../modules/projets/entities/projet.entity';
import { Produit } from '../modules/stocks/entities/produit.entity';
import { User } from '../modules/users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const host = configService.get<string>('DB_HOST');
        const port = configService.get<number>('DB_PORT');
        const username = configService.get<string>('DB_USERNAME');
        const password = configService.get<string>('DB_PASSWORD');
        const database = configService.get<string>('DB_NAME');
        const synchronize = configService.get<boolean>('DB_SYNCHRONIZE');
        const logging = configService.get<boolean>('DB_LOGGING');
        const ssl = configService.get<boolean>('DB_SSL');

        console.log('🔧 DatabaseModule - Configuration reçue du ConfigService:');
        console.log(`  host: ${host}`);
        console.log(`  port: ${port}`);
        console.log(`  username: ${username}`);
        console.log(`  password: ${'*'.repeat(password?.length || 0)}`);
        console.log(`  database: ${database}`);
        console.log(`  synchronize: ${synchronize}`);

        const entities = [
          User,
          Clients,
          Produit,
          Machine,
          Notifications,
          Commande,
          OrdreFabrication,
          Projet
        ];
        console.log('🔧 Entités chargées:', entities.map(e => e.name));

        return {
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,
          entities,
          synchronize,
          logging,
          ssl: ssl ? { rejectUnauthorized: false } : false,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

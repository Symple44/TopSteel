// apps/api/src/database/database.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from './data-source';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ...dataSourceOptions,
        autoLoadEntities: true, // Charge automatiquement les entités
        retryAttempts: 3,
        retryDelay: 3000,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
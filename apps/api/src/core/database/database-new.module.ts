import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { createDatabaseConfig } from './database.config'
import { DatabaseHealthService } from './services/health.service'
// Services
import { MigrationService } from './services/migration.service'
import { SeederService } from './services/seeder.service'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [MigrationService, SeederService, DatabaseHealthService],
  exports: [MigrationService, SeederService, DatabaseHealthService],
})
export class DatabaseNewModule {}

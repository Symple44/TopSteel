import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { createDatabaseConfig } from './database.config'

// Services
import { MigrationService } from './services/migration.service'
import { SeederService } from './services/seeder.service'
import { DatabaseHealthService } from './services/health.service'

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: createDatabaseConfig,
      inject: [ConfigService],
    }),
  ],
  providers: [
    MigrationService,
    SeederService,
    DatabaseHealthService,
  ],
  exports: [
    MigrationService,
    SeederService,
    DatabaseHealthService,
  ],
})
export class DatabaseNewModule {}
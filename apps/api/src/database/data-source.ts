// apps/api/src/database/data-source.ts
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

config();

const configService = new ConfigService();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: configService.get('DB_NAME', 'erp_topsteel'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false, // TOUJOURS false en production
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('DB_SSL') === 'true' ? {
    rejectUnauthorized: false,
  } : false,
};

export default new DataSource(dataSourceOptions);
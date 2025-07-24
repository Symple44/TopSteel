// Data source template pour les bases TENANT
import { ConfigService } from '@nestjs/config'
import { config } from 'dotenv'
import type { DataSourceOptions } from 'typeorm'
import { DataSource } from 'typeorm'

config()

const configService = new ConfigService()

export const tenantDataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: configService.get('DB_HOST', 'localhost'),
  port: configService.get('DB_PORT', 5432),
  username: configService.get('DB_USERNAME', 'postgres'),
  password: configService.get('DB_PASSWORD', 'postgres'),
  database: 'erp_topsteel_topsteel', // Base tenant par défaut
  entities: [
    'src/modules/clients/entities/*.entity{.ts,.js}',
    'src/modules/fournisseurs/entities/*.entity{.ts,.js}',
    'src/modules/materiaux/entities/*.entity{.ts,.js}',
    'src/modules/stocks/entities/*.entity{.ts,.js}',
    'src/modules/produits/entities/*.entity{.ts,.js}',
    'src/modules/commandes/entities/*.entity{.ts,.js}',
    'src/modules/devis/entities/*.entity{.ts,.js}',
    'src/modules/production/entities/*.entity{.ts,.js}',
    'src/modules/planning/entities/*.entity{.ts,.js}',
    'src/modules/qualite/entities/*.entity{.ts,.js}',
    'src/modules/maintenance/entities/*.entity{.ts,.js}',
    'src/modules/machines/entities/*.entity{.ts,.js}',
    'src/modules/documents/entities/*.entity{.ts,.js}',
    'src/modules/projets/entities/*.entity{.ts,.js}',
    'src/modules/facturation/entities/*.entity{.ts,.js}',
    'src/modules/tracabilite/entities/*.entity{.ts,.js}',
    'src/modules/notifications/entities/*.entity{.ts,.js}'
  ],
  migrations: ['src/database/migrations/tenant/*{.ts,.js}'],
  migrationsRun: false,
  synchronize: false,
  logging: configService.get('NODE_ENV') === 'development',
}

export default new DataSource(tenantDataSourceOptions)
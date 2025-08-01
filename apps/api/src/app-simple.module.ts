import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuRawController } from './features/admin/controllers/menu-raw.controller'
import { MenuRawService } from './features/admin/services/menu-raw.service'

// Configuration simple pour la base AUTH
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      name: 'auth',
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'postgres',
      database: 'erp_topsteel_auth',
      synchronize: false,
      logging: false,
      entities: [],
    }),
  ],
  controllers: [MenuRawController],
  providers: [MenuRawService],
})
export class AppSimpleModule {}

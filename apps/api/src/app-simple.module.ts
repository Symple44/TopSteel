import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { MenuRawService } from './modules/admin/services/menu-raw.service'
import { MenuRawController } from './modules/admin/controllers/menu-raw.controller'

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
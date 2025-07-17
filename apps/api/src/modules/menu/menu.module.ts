import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UserMenuPreference } from './entities/user-menu-preference.entity'
import { UserMenuPreferenceService } from './services/user-menu-preference.service'
import { UserMenuPreferenceController } from './controllers/user-menu-preference.controller'

@Module({
  imports: [TypeOrmModule.forFeature([UserMenuPreference])],
  controllers: [UserMenuPreferenceController],
  providers: [UserMenuPreferenceService],
  exports: [UserMenuPreferenceService],
})
export class MenuModule {}
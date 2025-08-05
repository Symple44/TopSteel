import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PartnerController } from './controllers/partner.controller'
import { Partner } from './entities/partner.entity'
import { IPartnerRepository } from './repositories/partner.repository'
import { PartnerRepositoryImpl } from './repositories/partner-repository.impl'
import { PartnerService } from './services/partner.service'

/**
 * Module pour la gestion des partenaires (clients/fournisseurs)
 */
@Module({
  imports: [TypeOrmModule.forFeature([Partner], 'tenant')],
  controllers: [PartnerController],
  providers: [
    PartnerService,
    {
      provide: 'IPartnerRepository',
      useClass: PartnerRepositoryImpl,
    },
  ],
  exports: [PartnerService],
})
export class PartnersModule {}

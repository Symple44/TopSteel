import { Module, type OnModuleInit } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ParameterSystem } from '../../features/parameters/entities/parameter-system.entity'
import { PartnerController } from './controllers/partner.controller'
import { Contact } from './entities/contact.entity'
import { Partner } from './entities/partner.entity'
import { PartnerAddress } from './entities/partner-address.entity'
import { PartnerGroup } from './entities/partner-group.entity'
import { PartnerSite } from './entities/partner-site.entity'
import { ContactRepository } from './repositories/contact.repository'
import { PartnerAddressRepository } from './repositories/partner-address.repository'
import { PartnerGroupRepository } from './repositories/partner-group.repository'
import { PartnerRepositoryImpl } from './repositories/partner-repository.impl'
import { PartnerSiteRepository } from './repositories/partner-site.repository'
import { PartnerService } from './services/partner.service'
import { PartnerParametersInitService } from './services/partner-parameters-init.service'

/**
 * Module pour la gestion des partenaires (clients/fournisseurs)
 */
@Module({
  imports: [
    TypeOrmModule.forFeature(
      [Partner, PartnerGroup, Contact, PartnerSite, PartnerAddress],
      'tenant'
    ),
    TypeOrmModule.forFeature([ParameterSystem], 'auth'),
  ],
  controllers: [PartnerController],
  providers: [
    PartnerService,
    PartnerParametersInitService,
    PartnerRepositoryImpl,
    PartnerGroupRepository,
    ContactRepository,
    PartnerSiteRepository,
    PartnerAddressRepository,
    {
      provide: 'IPartnerRepository',
      useClass: PartnerRepositoryImpl,
    },
    {
      provide: 'IPartnerGroupRepository',
      useClass: PartnerGroupRepository,
    },
    {
      provide: 'IContactRepository',
      useClass: ContactRepository,
    },
    {
      provide: 'IPartnerSiteRepository',
      useClass: PartnerSiteRepository,
    },
    {
      provide: 'IPartnerAddressRepository',
      useClass: PartnerAddressRepository,
    },
  ],
  exports: [PartnerService, PartnerParametersInitService],
})
export class PartnersModule implements OnModuleInit {
  constructor(private readonly partnerParametersInitService: PartnerParametersInitService) {}

  async onModuleInit() {
    // Initialiser les paramètres au démarrage du module
    await this.partnerParametersInitService.initializePartnerParameters()
  }
}

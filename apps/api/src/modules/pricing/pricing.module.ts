import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'
import { BTPIndexController } from './controllers/btp-index.controller'
import { SectorPricingController } from './controllers/sector-pricing.controller'
import { BTPIndex } from './entities/btp-index.entity'
import { CustomerSectorAssignment } from './entities/customer-sector-assignment.entity'
import { SectorCoefficient } from './entities/sector-coefficient.entity'
import { BTPIndexService } from './services/btp-index.service'
import { SectorPricingService } from './services/sector-pricing.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([SectorCoefficient, CustomerSectorAssignment, BTPIndex], 'tenant'),
    TypeOrmModule.forFeature([SocieteUser], 'auth'),
  ],
  controllers: [SectorPricingController, BTPIndexController],
  providers: [SectorPricingService, BTPIndexService],
  exports: [SectorPricingService, BTPIndexService],
})
export class PricingModule {}

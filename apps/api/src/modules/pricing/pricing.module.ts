import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SectorCoefficient } from './entities/sector-coefficient.entity'
import { CustomerSectorAssignment } from './entities/customer-sector-assignment.entity'
import { BTPIndex } from './entities/btp-index.entity'
import { SocieteUser } from '../../features/societes/entities/societe-user.entity'
import { SectorPricingService } from './services/sector-pricing.service'
import { BTPIndexService } from './services/btp-index.service'
import { SectorPricingController } from './controllers/sector-pricing.controller'
import { BTPIndexController } from './controllers/btp-index.controller'

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

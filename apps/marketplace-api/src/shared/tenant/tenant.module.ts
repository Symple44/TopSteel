import { Module, Global } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantResolver } from './tenant-resolver.service'
import { TenantGuard } from './tenant.guard'
import { Societe } from '../entities/erp/societe.entity'

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Societe], 'erpAuth'),
  ],
  providers: [
    TenantResolver,
    TenantGuard,
  ],
  exports: [
    TenantResolver,
    TenantGuard,
  ],
})
export class TenantModule {}
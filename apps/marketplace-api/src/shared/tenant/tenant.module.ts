import { Global, Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Societe } from '../entities/erp/societe.entity'
import { TenantGuard } from './tenant.guard'
import { TenantResolver } from './tenant-resolver.service'

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Societe], 'erpAuth')],
  providers: [TenantResolver, TenantGuard],
  exports: [TenantResolver, TenantGuard],
})
export class TenantModule {}

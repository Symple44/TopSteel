import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PageTemplate, PageSection, SectionPreset } from './entities'
import { PageBuilderService } from './services/page-builder.service'
import { PageBuilderController } from './controllers/page-builder.controller'
import { TenantModule } from '../../shared/tenant/tenant.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([PageTemplate, PageSection, SectionPreset], 'marketplace'), // Utiliser la connection marketplace
    TenantModule, // Importer le TenantModule pour le TenantGuard
  ],
  controllers: [PageBuilderController],
  providers: [PageBuilderService],
  exports: [PageBuilderService],
})
export class PageBuilderModule {}

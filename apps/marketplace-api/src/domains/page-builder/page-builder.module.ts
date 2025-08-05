import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TenantModule } from '../../shared/tenant/tenant.module'
import { PageBuilderController } from './controllers/page-builder.controller'
import { PageSection, PageTemplate, SectionPreset } from './entities'
import { PageBuilderService } from './services/page-builder.service'

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

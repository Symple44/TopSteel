import { Module } from '@nestjs/common'
import { PrismaModule } from '../../../core/database/prisma/prisma.module'
import { SocietePrismaService } from './societe-prisma.service'
import { SocieteLicensePrismaService } from './societe-license-prisma.service'
import { SocieteUserPrismaService } from './societe-user-prisma.service'
import { UserSocieteRolePrismaService } from './user-societe-role-prisma.service'
import { SitePrismaService } from './site-prisma.service'
import { SocietesPrismaController } from './societes-prisma.controller'
import { SocieteLicensesPrismaController } from './societe-licenses-prisma.controller'
import { SocieteUsersPrismaController } from './societe-users-prisma.controller'
import { SitesPrismaController } from './sites-prisma.controller'

/**
 * SocietesPrismaModule - Phase 2.2 + 8.1
 *
 * Module pour gestion des sociétés avec Prisma (Infrastructure Multi-Tenant)
 *
 * Controllers:
 * - SocietesPrismaController: Endpoints REST /societes-prisma (Phase 8.1)
 *
 * Provides:
 * - SocietePrismaService pour gestion sociétés
 * - SocieteLicensePrismaService pour gestion licences
 * - SocieteUserPrismaService pour associations user-societe
 * - UserSocieteRolePrismaService pour rôles user-societe-role
 * - SitePrismaService pour sites/localisations
 *
 * Utilisé pour:
 * - Gestion multi-sociétés (Infrastructure)
 * - Licences et restrictions
 * - Memberships et rôles
 * - Sites et localisations
 */
@Module({
  imports: [PrismaModule],
  controllers: [
    SocietesPrismaController,
    SocieteLicensesPrismaController,
    SocieteUsersPrismaController,
    SitesPrismaController,
  ],
  providers: [
    SocietePrismaService,
    SocieteLicensePrismaService,
    SocieteUserPrismaService,
    UserSocieteRolePrismaService,
    SitePrismaService,
  ],
  exports: [
    SocietePrismaService,
    SocieteLicensePrismaService,
    SocieteUserPrismaService,
    UserSocieteRolePrismaService,
    SitePrismaService,
  ],
})
export class SocietesPrismaModule {}

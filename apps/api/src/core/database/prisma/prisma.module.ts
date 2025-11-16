import { Global, Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { PrismaService } from './prisma.service'

/**
 * PrismaModule - Module global Prisma
 *
 * @Global decorator permet d'utiliser PrismaService dans toute l'application
 * sans avoir à importer PrismaModule partout
 *
 * Features:
 * - Service Prisma injectable globalement
 * - Configuration via ConfigModule
 * - Lifecycle hooks automatiques
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}

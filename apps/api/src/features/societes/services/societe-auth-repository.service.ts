import { Injectable } from '@nestjs/common'
import type {
  ISocieteRepository,
  ISocieteUserRepository,
} from '../../../domains/auth/core/interfaces/societe-repository.interface'
import type { Societe, SocieteUser } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'

/**
 * Implémentation Prisma du repository société pour l'authentification
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class SocieteAuthRepositoryService implements ISocieteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Societe | null> {
    return (await this.prisma.societe.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    })) as any
  }

  async findByCode(code: string): Promise<Societe | null> {
    return (await this.prisma.societe.findFirst({
      where: { code },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
    })) as any
  }

  async findActiveSocietes(): Promise<Societe[]> {
    return (await this.prisma.societe.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
      },
      orderBy: { name: 'asc' },
    })) as any
  }
}

/**
 * Implémentation Prisma du repository relation utilisateur-société pour l'authentification
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class SocieteUserAuthRepositoryService implements ISocieteUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Array<SocieteUser & { societe: Societe }>> {
    return await this.prisma.societeUser.findMany({
      where: { userId },
      include: { societe: true },
    })
  }

  async findByUserAndSociete(
    userId: string,
    societeId: string
  ): Promise<(SocieteUser & { societe: Societe }) | null> {
    return await this.prisma.societeUser.findFirst({
      where: { userId, societeId },
      include: { societe: true },
    })
  }

  async userBelongsToSociete(userId: string, societeId: string): Promise<boolean> {
    const count = await this.prisma.societeUser.count({
      where: { userId, societeId },
    })
    return count > 0
  }

  async updateDefaultSociete(userId: string, societeId: string): Promise<void> {
    // Note: Prisma schema doesn't have isDefault field on SocieteUser
    // This would need to be implemented differently or the schema needs to be updated
    // For now, we'll leave this as a no-op to allow compilation
    console.warn(
      `updateDefaultSociete called but isDefault field doesn't exist in Prisma schema for SocieteUser`
    )
  }
}

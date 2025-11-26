import type { Prisma } from '@prisma/client'
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'

/**
 * Guard pour gérer la logique multi-tenant
 * Migrated from TypeORM to Prisma
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()
    const user = request.user

    if (!user) {
      return false
    }

    // Récupérer les sociétés de l'utilisateur
    const societeUsers = await this.prisma.societeUser.findMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      include: {
        societe: true,
      },
    })

    // Attacher les données au request
    request.societes = societeUsers
    request.tenant = societeUsers[0]?.societe

    return true
  }
}

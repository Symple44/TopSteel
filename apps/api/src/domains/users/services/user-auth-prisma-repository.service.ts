import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { IUserRepository } from '../../auth/core/interfaces/user-repository.interface'
import type { User } from '../entities/user.entity'

/**
 * Implémentation Prisma du repository utilisateur pour l'authentification
 * Respecte le principe d'inversion de dépendance
 */
@Injectable()
export class UserAuthPrismaRepositoryService implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailOrAcronym(emailOrAcronym: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: emailOrAcronym }, { acronyme: emailOrAcronym }],
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        acronyme: true,
        password: true,
        role: true,
      },
    })

    return user as User | null
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        acronyme: true,
        role: true,
      },
    })

    return user as User | null
  }

  async updateLastLogin(_userId: string, _lastLogin: Date): Promise<void> {
    // L'entité User ne contient pas de champ lastLogin - peut être ajouté plus tard
    // Pour l'instant, on ne fait rien ou on peut enregistrer dans une table séparée
    // await this.prisma.user.update({
    //   where: { id: userId },
    //   data: { lastLogin },
    // })
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { email } })
    return count > 0
  }

  async existsByAcronym(acronym: string): Promise<boolean> {
    const count = await this.prisma.user.count({ where: { acronyme: acronym } })
    return count > 0
  }
}

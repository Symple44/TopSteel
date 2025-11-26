import type { User } from '@prisma/client'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Injectable } from '@nestjs/common'

import { IUserRepository } from '../../auth/core/interfaces/user-repository.interface'

/**
 * Implémentation du repository utilisateur pour l'authentification
 * Respecte le principe d'inversion de dépendance
 */
@Injectable()
export class UserAuthRepositoryService implements IUserRepository {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  async findByEmailOrAcronym(emailOrAcronym: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrAcronym },
          { acronyme: emailOrAcronym }
        ]
      },
    })
  }

  async findById(id: string): Promise<User | null> {
    return await this.prisma.user.findFirst({
      where: { id },
    })
  }

  async updateLastLogin(_userId: string, _lastLogin: Date): Promise<void> {
    // L'entité User ne contient pas de champ lastLogin - peut être ajouté plus tard
    // Pour l'instant, on ne fait rien ou on peut enregistrer dans une table séparée
    // await this.userRepository.update(userId, { /* lastLogin field doesn't exist */ })
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


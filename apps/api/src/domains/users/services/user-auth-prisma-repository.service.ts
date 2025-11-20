import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { IUserRepository } from '../../auth/core/interfaces/user-repository.interface'

@Injectable()
export class UserAuthPrismaRepositoryService implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailOrAcronym(emailOrAcronym: string) {
    return this.prisma.user.findFirst({
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
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        acronyme: true,
        role: true,
        actif: true,
        createdAt: true,
        updatedAt: true,
      },
    })
  }

  async updateLastLogin(userId: string, lastLogin: Date): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dernier_login: lastLogin },
    })
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

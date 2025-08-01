import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import type { IUserRepository } from '../../auth/core/interfaces/user-repository.interface'
import { User } from '../entities/user.entity'

/**
 * Implémentation du repository utilisateur pour l'authentification
 * Respecte le principe d'inversion de dépendance
 */
@Injectable()
export class UserAuthRepositoryService implements IUserRepository {
  constructor(
    @InjectRepository(User, 'auth')
    private readonly userRepository: Repository<User>
  ) {}

  async findByEmailOrAcronym(emailOrAcronym: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: [
        { email: emailOrAcronym },
        { acronyme: emailOrAcronym }
      ],
      select: ['id', 'email', 'nom', 'prenom', 'acronyme', 'password', 'role']
    })
  }

  async findById(id: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email', 'nom', 'prenom', 'acronyme', 'role']
    })
  }

  async updateLastLogin(userId: string, lastLogin: Date): Promise<void> {
    // L'entité User ne contient pas de champ lastLogin - peut être ajouté plus tard
    // Pour l'instant, on ne fait rien ou on peut enregistrer dans une table séparée
    // await this.userRepository.update(userId, { /* lastLogin field doesn't exist */ })
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { email } })
    return count > 0
  }

  async existsByAcronym(acronym: string): Promise<boolean> {
    const count = await this.userRepository.count({ where: { acronyme: acronym } })
    return count > 0
  }
}
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { SocieteStatus } from '../../../../features/societes/entities/societe.entity'
import type { LoginDto } from '../../external/dto/login.dto'
import {
  ISocieteRepository,
  ISocieteUserRepository,
} from '../interfaces/societe-repository.interface'
import { IUserRepository } from '../interfaces/user-repository.interface'
import {
  SOCIETE_REPOSITORY_TOKEN,
  SOCIETE_USER_REPOSITORY_TOKEN,
  USER_REPOSITORY_TOKEN,
} from '../providers/auth-repository.providers'

/**
 * Service d'authentification principal utilisant une architecture modulaire
 * Implémente les fonctionnalités d'authentification essentielles
 */
@Injectable()
export class AuthCoreService {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
    @Inject(SOCIETE_REPOSITORY_TOKEN)
    private readonly societeRepository: ISocieteRepository,
    @Inject(SOCIETE_USER_REPOSITORY_TOKEN)
    private readonly societeUserRepository: ISocieteUserRepository,
  ) {}

  /**
   * Valide les identifiants d'un utilisateur
   */
  async validateUser(emailOrAcronym: string, password: string): Promise<any> {
    const user = await this.userRepository.findByEmailOrAcronym(emailOrAcronym)
    if (!user) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials')
    }

    const { password: _, ...result } = user
    return result
  }

  /**
   * Récupère les sociétés d'un utilisateur
   */
  async getUserSocietes(userId: string) {
    const societeUsers = await this.societeUserRepository.findByUserId(userId)

    return societeUsers
      .filter((su) => su.societe?.status === SocieteStatus.ACTIVE)
      .map((su) => ({
        id: su.societe.id,
        nom: su.societe.nom,
        code: su.societe.code,
        isDefault: su.isDefault,
      }))
  }

  /**
   * Vérifie si un utilisateur appartient à une société
   */
  async userBelongsToSociete(userId: string, societeId: string): Promise<boolean> {
    return await this.societeUserRepository.userBelongsToSociete(userId, societeId)
  }

  /**
   * Trouve une société par code
   */
  async findSocieteByCode(code: string) {
    return await this.societeRepository.findByCode(code)
  }

  /**
   * Trouve toutes les sociétés actives
   */
  async findActiveSocietes() {
    return await this.societeRepository.findActiveSocietes()
  }
}

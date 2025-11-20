import { Provider } from '@nestjs/common'
import {
  SocieteAuthRepositoryService,
  SocieteUserAuthRepositoryService,
} from '../../../../features/societes/services/societe-auth-repository.service'
import { UserAuthPrismaRepositoryService } from '../../../users/services/user-auth-prisma-repository.service'
import type {
  ISocieteRepository,
  ISocieteUserRepository,
} from '../interfaces/societe-repository.interface'
import { IUserRepository } from '../interfaces/user-repository.interface'

// Tokens pour l'injection de dépendance
export const USER_REPOSITORY_TOKEN = Symbol('USER_REPOSITORY_TOKEN')
export const SOCIETE_REPOSITORY_TOKEN = Symbol('SOCIETE_REPOSITORY_TOKEN')
export const SOCIETE_USER_REPOSITORY_TOKEN = Symbol('SOCIETE_USER_REPOSITORY_TOKEN')

/**
 * Providers pour l'injection des repositories selon le pattern Dependency Inversion
 */
export const AuthRepositoryProviders: Provider[] = [
  {
    provide: USER_REPOSITORY_TOKEN,
    useClass: UserAuthPrismaRepositoryService,
  },
  {
    provide: SOCIETE_REPOSITORY_TOKEN,
    useClass: SocieteAuthRepositoryService,
  },
  {
    provide: SOCIETE_USER_REPOSITORY_TOKEN,
    useClass: SocieteUserAuthRepositoryService,
  },
]

// Types pour l'injection
export type UserRepositoryToken = IUserRepository
export type SocieteRepositoryToken = ISocieteRepository
export type SocieteUserRepositoryToken = ISocieteUserRepository

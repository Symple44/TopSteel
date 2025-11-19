import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../../../core/database/prisma/prisma.service'
import { Prisma } from '@prisma/client'
import type { User, UserSettings } from '@prisma/client'
import * as bcrypt from 'bcrypt'

// Type helpers for User with relations
export type UserWithRoles = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: true
      }
    }
  }
}>

export type UserWithSettings = Prisma.UserGetPayload<{
  include: {
    settings: true
  }
}>

export type UserWithSocietes = Prisma.UserGetPayload<{
  include: {
    societeRoles: {
      include: {
        societe: true
        role: true
      }
    }
  }
}>

export type UserComplete = Prisma.UserGetPayload<{
  include: {
    roles: {
      include: {
        role: true
      }
    }
    groups: {
      include: {
        group: true
      }
    }
    societeRoles: {
      include: {
        societe: true
        role: true
      }
    }
    settings: true
  }
}>

/**
 * UserPrismaService - Phase 6.1
 *
 * Service de gestion des utilisateurs utilisant Prisma
 *
 * Fonctionnalités:
 * - CRUD utilisateurs avec bcrypt
 * - Gestion settings (profile, company, preferences)
 * - Gestion roles & groups
 * - Gestion sociétés
 * - Support password hashing et validation
 */
@Injectable()
export class UserPrismaService {
  private readonly logger = new Logger(UserPrismaService.name)
  private readonly BCRYPT_SALT_ROUNDS = 10

  constructor(private readonly prisma: PrismaService) {}

  // ============================================
  // USER CRUD OPERATIONS
  // ============================================

  /**
   * Créer un utilisateur avec hash bcrypt du mot de passe
   */
  async create(data: {
    email: string
    password: string
    username: string
    firstName?: string
    lastName?: string
    isActive?: boolean
  }): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Creating user: ${data.email}`)

    const passwordHash = await bcrypt.hash(data.password, this.BCRYPT_SALT_ROUNDS)

    try {
      // Vérifier si l'email existe déjà
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: data.email },
      })

      if (existingEmail) {
        throw new ConflictException('Un utilisateur avec cet email existe déjà')
      }

      // Vérifier si le username existe déjà
      const existingUsername = await this.prisma.user.findUnique({
        where: { username: data.username },
      })

      if (existingUsername) {
        throw new ConflictException('Un utilisateur avec ce nom d\'utilisateur existe déjà')
      }

      const user = await this.prisma.user.create({
        data: {
          email: data.email,
          username: data.username,
          passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      })

      this.logger.log(`User created successfully: ${user.id}`)

      // Exclure le passwordHash de la réponse
      const { passwordHash: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error creating user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer tous les utilisateurs avec pagination
   */
  async findAll(params: {
    skip?: number
    take?: number
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
    includeDeleted?: boolean
  } = {}): Promise<{ users: Omit<User, 'passwordHash'>[]; total: number }> {
    this.logger.debug('Finding all users')

    const { skip = 0, take = 10, where = {}, orderBy, includeDeleted = false } = params

    try {
      // Exclure les utilisateurs supprimés par défaut
      const whereClause: Prisma.UserWhereInput = includeDeleted
        ? where
        : { ...where, deletedAt: null }

      const [users, total] = await Promise.all([
        this.prisma.user.findMany({
          where: whereClause,
          skip,
          take,
          orderBy: orderBy || { createdAt: 'desc' },
        }),
        this.prisma.user.count({ where: whereClause }),
      ])

      // Exclure les passwordHash
      const usersWithoutPassword = users.map(({ passwordHash: _, ...user }) => user)

      return {
        users: usersWithoutPassword,
        total,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding users: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(
    id: string,
    includeRelations = false
  ): Promise<User | UserComplete | null> {
    this.logger.debug(`Finding user: ${id}`)

    try {
      const user = includeRelations
        ? await this.prisma.user.findUnique({
            where: { id },
            include: {
              roles: {
                include: {
                  role: true,
                },
              },
              groups: {
                include: {
                  group: true,
                },
              },
              societeRoles: {
                include: {
                  societe: true,
                  role: true,
                },
              },
              settings: true,
            },
          })
        : await this.prisma.user.findUnique({
            where: { id },
          })

      // Return null if user is soft-deleted
      if (user && user.deletedAt) {
        return null
      }

      return user
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Récupérer un utilisateur par email
   */
  async findByEmail(email: string): Promise<User | null> {
    this.logger.debug(`Finding user by email: ${email}`)

    try {
      return await this.prisma.user.findUnique({
        where: { email },
      })
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error finding user by email: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(
    id: string,
    data: {
      email?: string
      username?: string
      password?: string
      firstName?: string
      lastName?: string
      isActive?: boolean
      isEmailVerified?: boolean
      emailVerifiedAt?: Date
      lastLoginAt?: Date
    }
  ): Promise<Omit<User, 'passwordHash'>> {
    this.logger.log(`Updating user: ${id}`)

    try {
      // Vérifier que l'utilisateur existe
      const existingUser = await this.findOne(id)
      if (!existingUser) {
        throw new NotFoundException('Utilisateur non trouvé')
      }

      // Préparer les données de mise à jour
      const updateData: Prisma.UserUpdateInput = {
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        isActive: data.isActive,
        isEmailVerified: data.isEmailVerified,
        emailVerifiedAt: data.emailVerifiedAt,
        lastLoginAt: data.lastLoginAt,
      }

      // Hash le nouveau mot de passe si fourni
      if (data.password) {
        updateData.passwordHash = await bcrypt.hash(data.password, this.BCRYPT_SALT_ROUNDS)
      }

      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
      })

      this.logger.log(`User updated successfully: ${id}`)

      // Exclure le passwordHash
      const { passwordHash: _, ...userWithoutPassword } = user
      return userWithoutPassword
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error updating user: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async remove(id: string): Promise<void> {
    this.logger.log(`Soft deleting user: ${id}`)

    try {
      // Vérifier que l'utilisateur existe
      const user = await this.findOne(id)
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé')
      }

      // Soft delete
      await this.prisma.user.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isActive: false,
        },
      })

      this.logger.log(`User soft deleted successfully: ${id}`)
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error
      }
      const err = error as Error
      this.logger.error(`Error deleting user: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // USER SETTINGS
  // ============================================

  /**
   * Récupérer les paramètres d'un utilisateur
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    this.logger.debug(`Getting settings for user: ${userId}`)

    try {
      let settings = await this.prisma.userSettings.findUnique({
        where: { userId },
      })

      // Créer les settings par défaut si inexistants
      if (!settings) {
        settings = await this.prisma.userSettings.create({
          data: {
            userId,
            profile: {},
            company: {},
            preferences: {},
          },
        })
      }

      return settings
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user settings: ${err.message}`, err.stack)
      throw error
    }
  }

  /**
   * Mettre à jour les paramètres d'un utilisateur
   */
  async updateUserSettings(
    userId: string,
    data: {
      profile?: Prisma.InputJsonValue
      company?: Prisma.InputJsonValue
      preferences?: Prisma.InputJsonValue
    }
  ): Promise<UserSettings> {
    this.logger.log(`Updating settings for user: ${userId}`)

    try {
      // Vérifier si les settings existent
      const existingSettings = await this.prisma.userSettings.findUnique({
        where: { userId },
      })

      if (existingSettings) {
        // Mettre à jour les settings existants
        return await this.prisma.userSettings.update({
          where: { userId },
          data: {
            profile: data.profile,
            company: data.company,
            preferences: data.preferences,
          },
        })
      } else {
        // Créer les settings
        return await this.prisma.userSettings.create({
          data: {
            userId,
            profile: data.profile || {},
            company: data.company || {},
            preferences: data.preferences || {},
          },
        })
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error updating user settings: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Récupérer les statistiques globales des utilisateurs
   */
  async getStats(): Promise<{
    total: number
    active: number
    inactive: number
    emailVerified: number
    deleted: number
  }> {
    this.logger.debug('Getting user statistics')

    try {
      const [total, active, emailVerified, deleted] = await Promise.all([
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        this.prisma.user.count({ where: { isEmailVerified: true, deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: { not: null } } }),
      ])

      return {
        total,
        active,
        inactive: total - active,
        emailVerified,
        deleted,
      }
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error getting user stats: ${err.message}`, err.stack)
      throw error
    }
  }

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  /**
   * Valider le mot de passe d'un utilisateur
   */
  async validatePassword(userId: string, password: string): Promise<boolean> {
    this.logger.debug(`Validating password for user: ${userId}`)

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        return false
      }

      return await bcrypt.compare(password, user.passwordHash)
    } catch (error) {
      const err = error as Error
      this.logger.error(`Error validating password: ${err.message}`, err.stack)
      return false
    }
  }
}

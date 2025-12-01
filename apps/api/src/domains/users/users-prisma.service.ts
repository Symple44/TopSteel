import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../core/database/prisma/prisma.service'
import type { CreateUserDto } from './dto/create-user.dto'
import { GetUserSettingsResponseDto } from './dto/get-user-settings.dto'
import type { UpdateUserDto } from './dto/update-user.dto'
import type { UpdateUserSettingsDto } from './dto/update-user-settings.dto'
import type { UserQueryDto } from './dto/user-query.dto'

@Injectable()
export class UsersPrismaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.findByEmail(createUserDto.email)
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    // Transaction pour garantir l'atomicité : User + UserSettings
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: createUserDto.email,
          password: createUserDto.password,
          nom: createUserDto.nom,
          prenom: createUserDto.prenom,
          role: createUserDto.role || 'OPERATEUR',
          actif: createUserDto.actif !== undefined ? createUserDto.actif : true,
          // acronyme: createUserDto.acronyme || null,
          metadata: createUserDto.metadata as any,
        },
      })

      // Créer les paramètres par défaut dans la même transaction
      await tx.userSettings.create({
        data: {
          userId: user.id,
          profile: {
            firstName: user.prenom,
            lastName: user.nom,
            email: user.email,
          },
          company: {
            name: 'TopSteel Métallerie',
            address: "123 Rue de l'Industrie",
            city: 'Lyon',
            postalCode: '69001',
            country: 'France',
          },
          preferences: {
            language: 'fr',
            timezone: 'Europe/Paris',
            theme: 'vibrant',
            notifications: {
              email: true,
              push: true,
              sms: false,
              emailTypes: {
                newMessages: true,
                systemAlerts: true,
                taskReminders: false,
                weeklyReports: true,
                securityAlerts: true,
                maintenanceNotice: false,
              },
              pushTypes: {
                enabled: true,
                sound: true,
                urgent: true,
                normal: false,
                quiet: true,
              },
              quietHours: {
                enabled: true,
                start: '22:00',
                end: '07:00',
              },
            },
            appearance: {
              theme: 'vibrant',
              language: 'fr',
              fontSize: 'medium',
              sidebarWidth: 'normal',
              density: 'comfortable',
              accentColor: 'blue',
              contentWidth: 'compact',
            },
          },
        },
      })

      return user
    })
  }

  async findAll(query?: UserQueryDto) {
    const where: any = {}

    if (query?.actif !== undefined) {
      where.actif = query.actif
    }

    if (query?.role) {
      where.role = query.role
    }

    if (query?.search) {
      where.OR = [
        { nom: { contains: query.search, mode: 'insensitive' } },
        { prenom: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        createdAt: true,
        dernier_login: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: query?.page && query?.limit ? (query.page - 1) * query.limit : undefined,
      take: query?.limit,
    })
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        actif: true,
        createdAt: true,
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    return user
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } })
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } })
  }

  async findByEmailOrAcronym(identifier: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { acronyme: identifier }],
      },
    })
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id)

    if (updateUserDto.email) {
      const existingUser = await this.findByEmail(updateUserDto.email)
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already exists')
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        email: updateUserDto.email,
        password: updateUserDto.password,
        nom: updateUserDto.nom,
        prenom: updateUserDto.prenom,
        role: updateUserDto.role,
        actif: updateUserDto.actif,
        // acronyme: updateUserDto.acronyme || undefined,
        metadata: updateUserDto.metadata as any,
      },
    })
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id)
    await this.prisma.user.delete({ where: { id } })
  }

  async updateRefreshToken(userId: string, refreshToken: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: refreshToken || null },
    })
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { dernier_login: new Date() },
    })
  }

  async activate(id: string) {
    return this.update(id, { actif: true })
  }

  async deactivate(id: string) {
    return this.update(id, { actif: false })
  }

  async getStats() {
    const [total, active, inactive, admins, managers, operators] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { actif: true } }),
      this.prisma.user.count({ where: { actif: false } }),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { role: 'MANAGER' } }),
      this.prisma.user.count({ where: { role: 'OPERATEUR' } }),
    ])

    return {
      total,
      active,
      inactive,
      byRole: {
        admins,
        managers,
        operators,
      },
    }
  }

  async getUserSettings(userId: string): Promise<GetUserSettingsResponseDto> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      const defaultSettings = await this.createDefaultUserSettings(userId)
      return GetUserSettingsResponseDto.fromEntity(defaultSettings as any)
    }

    return GetUserSettingsResponseDto.fromEntity(settings as any)
  }

  async updateUserSettings(
    userId: string,
    updateDto: UpdateUserSettingsDto
  ): Promise<GetUserSettingsResponseDto> {
    let settings = await this.prisma.userSettings.findUnique({
      where: { userId },
    })

    if (!settings) {
      settings = await this.createDefaultUserSettings(userId)
    }

    // Fusionner les nouvelles données
    const updatedProfile = updateDto.profile
      ? { ...(settings.profile as any), ...updateDto.profile }
      : settings.profile

    const updatedCompany = updateDto.company
      ? { ...(settings.company as any), ...updateDto.company }
      : settings.company

    let updatedPreferences = settings.preferences as any

    if (updateDto.preferences) {
      if (updateDto.preferences.language !== undefined) {
        updatedPreferences.language = updateDto.preferences.language
      }
      if (updateDto.preferences.timezone !== undefined) {
        updatedPreferences.timezone = updateDto.preferences.timezone
      }
      if (updateDto.preferences.theme !== undefined) {
        updatedPreferences.theme = updateDto.preferences.theme
      }

      if (updateDto.preferences.notifications) {
        const newNotifications = updateDto.preferences.notifications
        if (newNotifications.email !== undefined) {
          updatedPreferences.notifications.email = newNotifications.email
        }
        if (newNotifications.push !== undefined) {
          updatedPreferences.notifications.push = newNotifications.push
        }
        if (newNotifications.sms !== undefined) {
          updatedPreferences.notifications.sms = newNotifications.sms
        }

        if (newNotifications.emailTypes && updatedPreferences.notifications.emailTypes) {
          Object.assign(updatedPreferences.notifications.emailTypes, newNotifications.emailTypes)
        }

        if (newNotifications.pushTypes && updatedPreferences.notifications.pushTypes) {
          Object.assign(updatedPreferences.notifications.pushTypes, newNotifications.pushTypes)
        }

        if (newNotifications.quietHours && updatedPreferences.notifications.quietHours) {
          Object.assign(updatedPreferences.notifications.quietHours, newNotifications.quietHours)
        }
      }

      if (updateDto.preferences.appearance && updatedPreferences.appearance) {
        Object.assign(updatedPreferences.appearance, updateDto.preferences.appearance)
      }
    }

    const updatedMetadata = updateDto.metadata
      ? { ...(settings.metadata as any), ...updateDto.metadata }
      : settings.metadata

    const updatedSettings = await this.prisma.userSettings.update({
      where: { userId },
      data: {
        profile: updatedProfile,
        company: updatedCompany,
        preferences: updatedPreferences,
        metadata: updatedMetadata,
      },
    })

    return GetUserSettingsResponseDto.fromEntity(updatedSettings as any)
  }

  private async createDefaultUserSettings(userId: string) {
    const user = await this.findOne(userId)

    return this.prisma.userSettings.create({
      data: {
        userId,
        profile: {
          firstName: user.prenom,
          lastName: user.nom,
          email: user.email,
        },
        company: {
          name: 'TopSteel Métallerie',
          address: "123 Rue de l'Industrie",
          city: 'Lyon',
          postalCode: '69001',
          country: 'France',
        },
        preferences: {
          language: 'fr',
          timezone: 'Europe/Paris',
          theme: 'vibrant',
          notifications: {
            email: true,
            push: true,
            sms: false,
            emailTypes: {
              newMessages: true,
              systemAlerts: true,
              taskReminders: false,
              weeklyReports: true,
              securityAlerts: true,
              maintenanceNotice: false,
            },
            pushTypes: {
              enabled: true,
              sound: true,
              urgent: true,
              normal: false,
              quiet: true,
            },
            quietHours: {
              enabled: true,
              start: '22:00',
              end: '07:00',
            },
          },
          appearance: {
            theme: 'vibrant',
            language: 'fr',
            fontSize: 'medium',
            sidebarWidth: 'normal',
            density: 'comfortable',
            accentColor: 'blue',
            contentWidth: 'compact',
          },
        },
      },
    })
  }
}

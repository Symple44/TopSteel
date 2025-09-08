import { Body, Controller, Get, Post, Put, Request, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import type { Request as ExpressRequest } from 'express'
import { JwtAuthGuard } from '../../../domains/auth/security/guards/jwt-auth.guard'
import type { OptimizedCacheService } from '../../../infrastructure/cache/redis-optimized.service'
import type { MenuItemDto } from '../../admin/services/menu-configuration.service'
import type { UserMenuPreference } from '../entities/user-menu-preference.entity'
import type { UserMenuPreferenceService } from '../services/user-menu-preference.service'

@ApiTags('User Menu Preferences')
@Controller('user/menu-preferences')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserMenuPreferenceController {
  constructor(
    private readonly userMenuPreferenceService: UserMenuPreferenceService,
    private readonly cacheService: OptimizedCacheService
  ) {}

  @Get()
  @ApiOperation({ summary: "Récupérer les préférences de menu de l'utilisateur" })
  @ApiResponse({ status: 200, description: 'Préférences récupérées avec succès' })
  async getPreferences(
    @Request() req: ExpressRequest & { user: { id: string } }
  ): Promise<{ success: boolean; data: UserMenuPreference[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)

    return {
      success: true,
      data: preferences,
    }
  }

  @Get('selected-pages')
  @ApiOperation({ summary: 'Récupérer les pages sélectionnées' })
  async getSelectedPages(
    @Request() req: ExpressRequest & { user: { id: string } }
  ): Promise<{ success: boolean; data: string[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)

    return {
      success: true,
      data: preferences.filter((p) => p.isVisible).map((p) => p.menuId),
    }
  }

  @Put('menu-visibility')
  @ApiOperation({ summary: "Mettre à jour la visibilité d'un menu" })
  async updateMenuVisibility(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { menuId: string; isVisible: boolean }
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateMenuVisibility(
      userId,
      body.menuId,
      body.isVisible
    )

    return {
      success: true,
      data: updated,
    }
  }

  @Post('toggle-page')
  @ApiOperation({ summary: 'Activer/désactiver une page' })
  async togglePage(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { pageId: string }
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.togglePage(userId, body.pageId)

    return {
      success: true,
      data: updated,
    }
  }

  @Put('menu-order')
  @ApiOperation({ summary: "Changer l'ordre d'un menu" })
  async updateMenuOrder(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { menuId: string; order: number }
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    const updated = await this.userMenuPreferenceService.updateMenuOrder(
      userId,
      body.menuId,
      body.order
    )

    return {
      success: true,
      data: updated,
    }
  }

  @Put()
  @ApiOperation({ summary: 'Mettre à jour les préférences de menu' })
  async updatePreferences(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { menuId: string; isVisible?: boolean; order?: number; customLabel?: string }
  ): Promise<{ success: boolean; data: UserMenuPreference }> {
    const userId = req.user.id
    let updated: UserMenuPreference

    if (body.isVisible !== undefined) {
      updated = await this.userMenuPreferenceService.updateMenuVisibility(
        userId,
        body.menuId,
        body.isVisible
      )
    } else if (body.order !== undefined) {
      updated = await this.userMenuPreferenceService.updateMenuOrder(
        userId,
        body.menuId,
        body.order
      )
    } else if (body.customLabel !== undefined) {
      updated = await this.userMenuPreferenceService.updatePageCustomization(
        userId,
        body.menuId,
        body.customLabel
      )
    } else {
      // Si aucune propriété n'est fournie, récupérer les préférences existantes
      const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)
      updated = preferences.find((p) => p.menuId === body.menuId) || preferences[0]
    }

    return {
      success: true,
      data: updated,
    }
  }

  @Get('menu')
  @ApiOperation({ summary: 'Récupérer le menu personnalisé (legacy)' })
  async getCustomMenuLegacy(
    @Request() req: ExpressRequest & { user: { id: string } }
  ): Promise<{ success: boolean; data: MenuItemDto[] }> {
    const userId = req.user.id
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)

    // Mapping basé sur la vraie structure hiérarchique du projet
    const defaultMenuMapping = {
      // Pages principales
      home: {
        title: 'Accueil',
        href: '/',
        icon: 'Home',
        parentId: null,
        orderIndex: 0,
      },
      dashboard: {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: 'LayoutDashboard',
        parentId: null,
        orderIndex: 1,
      },

      // Section Administration (parent)
      admin: {
        title: 'Administration',
        href: '/admin',
        icon: 'Shield',
        parentId: null,
        orderIndex: 2,
      },

      // Sous-sections Administration (les menuId suivent le pattern admin-xxx)
      'admin-users': {
        title: 'Gestion des utilisateurs',
        href: '/admin/users',
        icon: 'Users',
        parentId: 'admin',
        orderIndex: 1,
      },
      'admin-roles': {
        title: 'Gestion des rôles',
        href: '/admin/roles',
        icon: 'Shield',
        parentId: 'admin',
        orderIndex: 2,
      },
      'admin-menu-config': {
        title: 'Configuration des menus',
        href: '/admin/menu-config',
        icon: 'Menu',
        parentId: 'admin',
        orderIndex: 3,
      },
      'admin-company': {
        title: 'Informations entreprise',
        href: '/admin/company',
        icon: 'Building',
        parentId: 'admin',
        orderIndex: 4,
      },
      'admin-database': {
        title: 'Base de données',
        href: '/admin/database',
        icon: 'Database',
        parentId: 'admin',
        orderIndex: 5,
      },
      'admin-notifications-rules': {
        title: 'Règles de notification',
        href: '/admin/notifications/rules',
        icon: 'Bell',
        parentId: 'admin',
        orderIndex: 6,
      },
      'admin-sessions': {
        title: 'Sessions utilisateurs',
        href: '/admin/sessions',
        icon: 'Clock',
        parentId: 'admin',
        orderIndex: 7,
      },
      'admin-translations': {
        title: 'Gestion des traductions',
        href: '/admin/translations',
        icon: 'Languages',
        parentId: 'admin',
        orderIndex: 8,
      },

      // Section Paramètres
      settings: {
        title: 'Paramètres',
        href: '/settings',
        icon: 'Settings',
        parentId: null,
        orderIndex: 3,
      },
      'settings-menu': {
        title: 'Personnalisation du menu',
        href: '/settings/menu',
        icon: 'Layout',
        parentId: 'settings',
        orderIndex: 1,
      },
      'settings-security': {
        title: 'Paramètres de sécurité',
        href: '/settings/security',
        icon: 'Lock',
        parentId: 'settings',
        orderIndex: 2,
      },

      // Section Profil
      profile: {
        title: 'Mon profil',
        href: '/profile',
        icon: 'User',
        parentId: null,
        orderIndex: 4,
      },

      // Modules métier (si disponibles)
      planning: {
        title: 'Planification',
        href: '/planning',
        icon: 'Calendar',
        parentId: null,
        orderIndex: 5,
      },
      'planning-test': {
        title: 'Planning de test',
        href: '/planning/test',
        icon: 'Calendar',
        parentId: 'planning',
        orderIndex: 1,
      },

      // Legacy/compatibilité
      users: {
        title: 'Utilisateurs',
        href: '/admin/users',
        icon: 'Users',
        parentId: 'admin',
        orderIndex: 1,
      },
      roles: {
        title: 'Rôles',
        href: '/admin/roles',
        icon: 'Shield',
        parentId: 'admin',
        orderIndex: 2,
      },
      clients: { title: 'Clients', href: '/clients', icon: 'Users', parentId: null, orderIndex: 6 },
      projets: {
        title: 'Projets',
        href: '/projets',
        icon: 'FolderOpen',
        parentId: null,
        orderIndex: 7,
      },
      stocks: { title: 'Stocks', href: '/stocks', icon: 'Package', parentId: null, orderIndex: 8 },
      production: {
        title: 'Production',
        href: '/production',
        icon: 'Factory',
        parentId: null,
        orderIndex: 9,
      },
    }

    // Construire une map des préférences pour un accès rapide
    const preferenceMap = new Map()
    preferences.forEach((p) => {
      preferenceMap.set(p.menuId, p)
    })

    // Construire tous les items de menu (visibles et leurs parents nécessaires)
    const allMenuItems = new Map()

    // Ajouter tous les items visibles et leurs parents nécessaires
    preferences
      .filter((p) => p.isVisible)
      .forEach((preference) => {
        const menuMapping = defaultMenuMapping as Record<
          string,
          (typeof defaultMenuMapping)[keyof typeof defaultMenuMapping]
        >
        const defaultMenu = menuMapping[preference.menuId] || {
          title:
            preference.menuId.charAt(0).toUpperCase() +
            preference.menuId.slice(1).replace('-', ' '),
          href: `/${preference.menuId}`,
          icon: 'FileText',
          parentId: null,
          orderIndex: preference.order,
        }

        // Ajouter l'item principal
        allMenuItems.set(preference.menuId, {
          id: preference.menuId,
          parentId: defaultMenu.parentId,
          title: preference.customLabel || defaultMenu.title,
          href: defaultMenu.href,
          icon: defaultMenu.icon,
          isVisible: preference.isVisible,
          order: preference.order,
          orderIndex: defaultMenu.orderIndex || preference.order,
          children: [],
          depth: defaultMenu.parentId ? 1 : 0,
          moduleId: preference.menuId,
        })

        // Ajouter le parent si nécessaire
        if (defaultMenu.parentId && !allMenuItems.has(defaultMenu.parentId)) {
          const parentMenu = menuMapping[defaultMenu.parentId]
          if (parentMenu) {
            allMenuItems.set(defaultMenu.parentId, {
              id: defaultMenu.parentId,
              parentId: parentMenu.parentId,
              title: parentMenu.title,
              href: parentMenu.href,
              icon: parentMenu.icon,
              isVisible: true, // Parent visible si enfant visible
              order: 0,
              orderIndex: parentMenu.orderIndex || 0,
              children: [],
              depth: 0,
              moduleId: defaultMenu.parentId,
            })
          }
        }
      })

    // Construire la hiérarchie parent/enfant
    const rootItems: MenuItemDto[] = []
    const itemsArray = Array.from(allMenuItems.values())

    // Trier par order d'abord
    itemsArray.sort((a, b) => a.orderIndex - b.orderIndex)

    // Organiser en hiérarchie
    itemsArray.forEach((item) => {
      if (item.parentId) {
        // Item enfant - l'ajouter à son parent
        const parent = allMenuItems.get(item.parentId)
        if (parent) {
          parent.children.push(item)
          parent.children.sort((a: MenuItemDto, b: MenuItemDto) => a.orderIndex - b.orderIndex)
        }
      } else {
        // Item racine
        rootItems.push(item)
      }
    })

    const menuItems = rootItems

    return {
      success: true,
      data: menuItems,
    }
  }

  @Post('reset')
  @ApiOperation({ summary: 'Réinitialiser les préférences' })
  async resetPreferences(
    @Request() req: ExpressRequest & { user: { id: string } }
  ): Promise<{ success: boolean; data: UserMenuPreference[] }> {
    const userId = req.user.id
    const reset = await this.userMenuPreferenceService.resetPreferences(userId)

    return {
      success: true,
      data: reset,
    }
  }

  @Post('custom-menu')
  @ApiOperation({ summary: 'Sauvegarder le menu personnalisé complet' })
  async saveCustomMenu(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { menuItems: MenuItemDto[] }
  ): Promise<{
    success: boolean
    data: { success: boolean; itemCount: number; savedAt: string }
    error?: string
  }> {
    const userId = req.user.id
    const { menuItems } = body

    try {
      // Sauvegarder le menu personnalisé dans les métadonnées utilisateur
      const result = await this.userMenuPreferenceService.saveCustomMenu(userId, menuItems)

      // Invalider le cache après la mise à jour
      const cacheKey = `user:custom-menu:${userId}`
      await this.cacheService.invalidatePattern(`${cacheKey}*`)

      return {
        success: true,
        data: result,
      }
    } catch (error) {
      return {
        success: false,
        data: { success: false, itemCount: 0, savedAt: new Date().toISOString() },
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Get('custom-menu')
  @ApiOperation({ summary: 'Récupérer le menu personnalisé complet' })
  async getCustomMenu(
    @Request() req: ExpressRequest & { user: { id: string } }
  ): Promise<{ success: boolean; data: MenuItemDto[]; error?: string }> {
    const userId = req.user.id
    const cacheKey = `user:custom-menu:${userId}`

    try {
      const cachedResult = await this.cacheService.get<{
        success: boolean
        data: MenuItemDto[]
        error?: string
      }>(cacheKey)
      if (cachedResult) {
        return cachedResult
      }

      const customMenu = await this.userMenuPreferenceService.getCustomMenu(userId)

      const result = {
        success: true,
        data: customMenu || [],
      }

      await this.cacheService.set(cacheKey, result, 300)

      return result
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  @Post('selected-pages')
  @ApiOperation({ summary: 'Sauvegarder les pages sélectionnées' })
  async saveSelectedPages(
    @Request() req: ExpressRequest & { user: { id: string } },
    @Body() body: { selectedPages: string[] }
  ): Promise<{ success: boolean; data: string[] }> {
    const userId = req.user.id
    const { selectedPages } = body

    // Mettre à jour la visibilité de toutes les pages
    const preferences = await this.userMenuPreferenceService.findOrCreateByUserId(userId)

    for (const preference of preferences) {
      const isSelected = selectedPages.includes(preference.menuId)
      if (preference.isVisible !== isSelected) {
        await this.userMenuPreferenceService.updateMenuVisibility(
          userId,
          preference.menuId,
          isSelected
        )
      }
    }

    // Pour les nouvelles pages qui n'ont pas encore de préférences
    for (const pageId of selectedPages) {
      const exists = preferences.some((p) => p.menuId === pageId)
      if (!exists) {
        await this.userMenuPreferenceService.updateMenuVisibility(userId, pageId, true)
      }
    }

    return {
      success: true,
      data: selectedPages,
    }
  }
}

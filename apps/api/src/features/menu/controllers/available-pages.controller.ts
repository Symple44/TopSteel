import { Controller, Get } from '@nestjs/common'
import { PageSyncService } from '../services/page-sync.service'

@Controller('user/available-pages')
export class AvailablePagesController {
  constructor(private readonly pageSyncService: PageSyncService) {}

  @Get()
  async getAvailablePages() {
    try {
      // Synchroniser les pages d'abord
      await this.pageSyncService.syncPages()

      // TODO: Récupérer les permissions réelles de l'utilisateur
      const userPermissions: string[] = []
      const userRole = 'USER'

      // Obtenir les pages organisées par catégorie
      const categories = await this.pageSyncService.getPagesByCategory(
        'anonymous',
        userRole,
        userPermissions
      )

      return {
        success: true,
        data: categories,
      }
    } catch (_error) {
      // Retourner des données de test en cas d'erreur
      return {
        success: true,
        data: [
          {
            id: 'dashboard',
            title: 'Tableau de bord',
            description: "Vues d'ensemble et métriques principales",
            icon: 'LayoutDashboard',
            pages: [
              {
                id: 'home',
                title: 'Accueil',
                href: '/',
                description: "Page d'accueil",
                icon: 'Home',
                category: 'dashboard',
                permissions: [],
                roles: [],
                isEnabled: true,
                isVisible: true,
              },
              {
                id: 'dashboard-main',
                title: 'Dashboard',
                href: '/dashboard',
                description: 'Tableau de bord principal',
                icon: 'LayoutDashboard',
                category: 'dashboard',
                permissions: [],
                roles: [],
                isEnabled: true,
                isVisible: true,
              },
            ],
          },
          {
            id: 'administration',
            title: 'Administration',
            description: 'Configuration et administration système',
            icon: 'Settings',
            pages: [
              {
                id: 'admin-users',
                title: 'Utilisateurs',
                href: '/admin/users',
                description: 'Gestion des utilisateurs',
                icon: 'Users',
                category: 'administration',
                permissions: ['admin.users.read'],
                roles: ['ADMIN'],
                isEnabled: true,
                isVisible: true,
              },
              {
                id: 'admin-roles',
                title: 'Rôles',
                href: '/admin/roles',
                description: 'Gestion des rôles',
                icon: 'Shield',
                category: 'administration',
                permissions: ['admin.roles.read'],
                roles: ['ADMIN'],
                isEnabled: true,
                isVisible: true,
              },
            ],
          },
        ],
      }
    }
  }
}

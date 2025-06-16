// apps/api/src/services/permissions.service.ts
export class PermissionsService {
  private static readonly PERMISSIONS = {
    'projets:read': 'Voir les projets',
    'projets:create': 'Créer des projets',
    'projets:update': 'Modifier des projets',
    'projets:delete': 'Supprimer des projets',
    'stocks:read': 'Voir les stocks',
    'stocks:manage': 'Gérer les stocks',
    'admin:users': 'Gérer les utilisateurs',
    'admin:system': 'Administration système',
  } as const

  static async verifierPermission(
    userId: string, 
    permission: keyof typeof PermissionsService.PERMISSIONS,
    ressourceId?: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { role: { include: { permissions: true } } }
    })

    if (!user) return false

    // Vérifier les permissions du rôle
    const hasPermission = user.role.permissions.some(p => p.nom === permission)
    if (!hasPermission) return false

    // Vérifications spécifiques par ressource
    if (ressourceId) {
      return await this.verifierAccesRessource(userId, permission, ressourceId)
    }

    return true
  }

  private static async verifierAccesRessource(
    userId: string, 
    permission: string, 
    ressourceId: string
  ): Promise<boolean> {
    // Exemple: un commercial ne peut voir que ses propres projets
    if (permission.startsWith('projets:')) {
      const projet = await prisma.projet.findUnique({
        where: { id: ressourceId },
        include: { responsable: true }
      })
      
      if (!projet) return false
      
      const user = await prisma.user.findUnique({ where: { id: userId } })
      if (user?.role === 'COMMERCIAL' && projet.responsableId !== userId) {
        return false
      }
    }

    return true
  }
}
import { type NextRequest, NextResponse } from 'next/server'
import { pageDiscoveryService } from '../../../../../services/page-discovery.service'

interface PageConfig {
  permissions?: string[]
  roles?: string[]
  [key: string]: any
}

export async function GET(request: NextRequest) {
  try {
    // Récupérer les permissions et rôles de l'utilisateur depuis les headers
    const authHeader = request?.headers?.get('authorization')
    const userPermissionsHeader = request?.headers?.get('x-user-permissions')
    const userRoleHeader = request?.headers?.get('x-user-role')

    const userPermissions = userPermissionsHeader ? userPermissionsHeader?.split(',') : []
    const userRole = userRoleHeader || 'user'

    // Découvrir les pages disponibles depuis le système de fichiers
    const categories = pageDiscoveryService?.discoverPages()

    // Filtrer les pages selon les permissions de l'utilisateur
    const filteredCategories = filterPagesByPermissions(categories, userPermissions, userRole)

    return NextResponse?.json({
      success: true,
      data: filteredCategories,
      user: {
        authenticated: !!authHeader,
        role: userRole,
        permissionCount: userPermissions.length,
      },
    })
  } catch {
    return NextResponse?.json({ success: false, error: 'Erreur interne' }, { status: 500 })
  }
}

function filterPagesByPermissions(
  categories: Array<{ pages: PageConfig[] }>,
  userPermissions: string[],
  userRole: string
) {
  const filteredCategories = categories
    .map((category) => ({
      ...category,
      pages: category?.pages?.filter((page: PageConfig) => {
        // Vérifier les permissions si définies
        if (page.permissions && page?.permissions?.length > 0) {
          // Vérifier si l'utilisateur a au moins une des permissions requises
          const hasPermission = userPermissions?.some((p) => page.permissions?.includes(p))
          if (!hasPermission) return false
        }

        // Vérifier les rôles si définis
        if (page.roles && page?.roles?.length > 0) {
          // Vérifier si l'utilisateur a le rôle requis
          const hasRole = page?.roles?.includes(userRole)
          if (!hasRole) return false
        }

        // Par défaut, autoriser la page
        return true
      }),
    }))
    .filter((category) => category?.pages?.length > 0)

  return filteredCategories
}

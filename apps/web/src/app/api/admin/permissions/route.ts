import { type NextRequest, NextResponse } from 'next/server'
import { fetchBackend } from '@/lib/auth-server'

export async function GET(request: NextRequest) {
  try {
    // D'abord essayer l'endpoint modules avec includePermissions
    const response = await fetchBackend('/admin/modules?includePermissions=true', request)

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        data: [
          { id: 'menu.read', name: 'Lecture Menu', action: 'read', module: 'Menu' },
          { id: 'menu.write', name: 'Écriture Menu', action: 'write', module: 'Menu' },
          { id: 'admin.read', name: 'Lecture Admin', action: 'read', module: 'Admin' },
          { id: 'admin.write', name: 'Écriture Admin', action: 'write', module: 'Admin' },
          { id: 'user.read', name: 'Lecture Utilisateur', action: 'read', module: 'User' },
          { id: 'user.write', name: 'Écriture Utilisateur', action: 'write', module: 'User' },
        ],
      })
    }

    const data = await response.json()

    // Extraire toutes les permissions de tous les modules
    const modules = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []
    const permissions: any[] = []

    if (Array.isArray(modules) && modules.length > 0) {
      modules.forEach((module: any) => {
        if (module.permissions && Array.isArray(module.permissions)) {
          module.permissions.forEach((permission: any) => {
            permissions.push({
              ...permission,
              module: module.name || module.code,
              action: permission.action || permission.name,
            })
          })
        }
      })
    } else {
      // Fallback permissions si pas de modules
      return NextResponse.json({
        success: true,
        data: [
          { id: 'menu.read', name: 'Lecture Menu', action: 'read', module: 'Menu' },
          { id: 'menu.write', name: 'Écriture Menu', action: 'write', module: 'Menu' },
          { id: 'admin.read', name: 'Lecture Admin', action: 'read', module: 'Admin' },
          { id: 'admin.write', name: 'Écriture Admin', action: 'write', module: 'Admin' },
        ],
      })
    }

    return NextResponse.json({
      success: true,
      data: permissions,
    })
  } catch (_error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des permissions',
        data: [],
      },
      { status: 500 }
    )
  }
}
